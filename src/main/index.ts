import { app, shell, BrowserWindow, ipcMain, nativeImage, Tray, Menu } from 'electron'
import { join } from 'path'
import { URL, pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { initDatabase, closeDatabase } from '../database/client'
import { blockRepository } from '../database/repositories'
import {
  setupAutoUpdater,
  setMainWindow,
  startPolling,
  checkPendingUpdate,
  checkForUpdates,
  getUpdateStatus,
  forceRestart,
  snoozeCriticalRestart,
  runBrewUpgrade
} from './autoUpdater'
import type { PendingUpdate } from '../shared/types'

type AppMode = 'normal' | 'menubar'
type WindowKind = 'main' | 'menubar'

export interface StoreSchema {
  pendingUpdate: PendingUpdate | null
  appMode: AppMode
}

const store = new Store<StoreSchema>({
  defaults: {
    pendingUpdate: null,
    appMode: 'normal'
  }
})

const isMac = process.platform === 'darwin'

const ALLOWED_EXTERNAL_PROTOCOLS = ['https:', 'http:']

function safeOpenExternal(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!ALLOWED_EXTERNAL_PROTOCOLS.includes(parsed.protocol)) {
      console.warn(`[Security] Blocked openExternal with protocol: ${parsed.protocol}`)
      return false
    }
    shell.openExternal(url)
    return true
  } catch {
    console.warn('[Security] Blocked openExternal with invalid URL')
    return false
  }
}

let mainWindow: BrowserWindow | null = null
let menubarWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const windowKinds = new Map<number, WindowKind>()

function isAppUrl(url: string): boolean {
  try {
    const target = new URL(url)
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      return target.origin === new URL(process.env['ELECTRON_RENDERER_URL']).origin
    }
    const appPage = pathToFileURL(join(__dirname, '../renderer/index.html'))
    return target.protocol === 'file:' && target.pathname === appPage.pathname
  } catch {
    return false
  }
}

function secureWebContents(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler((details) => {
    safeOpenExternal(details.url)
    return { action: 'deny' }
  })

  // Links rendered from markdown would otherwise navigate the app window away,
  // leaving an external page with access to the preload API
  window.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return
    event.preventDefault()
    safeOpenExternal(url)
  })
}

function getIconPath(): string {
  return is.dev
    ? join(__dirname, '../../resources/icon.png')
    : join(process.resourcesPath, 'icon.png')
}

function getTrayIconPath(): string {
  return is.dev
    ? join(__dirname, '../../resources/trayTemplate.png')
    : join(process.resourcesPath, 'trayTemplate.png')
}

function registerWindowKind(window: BrowserWindow, kind: WindowKind): void {
  const webContentsId = window.webContents.id
  windowKinds.set(webContentsId, kind)

  window.on('closed', () => {
    windowKinds.delete(webContentsId)

    if (kind === 'main') {
      mainWindow = null
    }

    if (kind === 'menubar') {
      menubarWindow = null
    }
  })
}

function loadWindowContent(window: BrowserWindow, kind: WindowKind): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    url.searchParams.set('window', kind)
    window.loadURL(url.toString())
    return
  }

  window.loadFile(join(__dirname, '../renderer/index.html'), {
    query: { window: kind }
  })
}

function getAppMode(): AppMode {
  if (!isMac) return 'normal'
  return store.get('appMode')
}

function showMainWindow(): void {
  if (!mainWindow) return

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
}

function destroyMenubarWindow(): void {
  if (!menubarWindow) return
  menubarWindow.destroy()
  menubarWindow = null
}

function positionMenubarWindow(): void {
  if (!tray || !menubarWindow) return

  const trayBounds = tray.getBounds()
  const windowBounds = menubarWindow.getBounds()

  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  const y = Math.round(trayBounds.y + trayBounds.height + 6)

  menubarWindow.setPosition(x, y, false)
}

function createMenubarWindow(): void {
  if (!isMac || menubarWindow) return

  menubarWindow = new BrowserWindow({
    width: 420,
    height: 560,
    minWidth: 420,
    minHeight: 560,
    maxWidth: 420,
    maxHeight: 560,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--window-kind=menubar']
    }
  })

  registerWindowKind(menubarWindow, 'menubar')

  menubarWindow.on('blur', () => {
    if (getAppMode() === 'menubar') {
      menubarWindow?.hide()
    }
  })

  menubarWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      menubarWindow?.hide()
    }
  })

  secureWebContents(menubarWindow)

  loadWindowContent(menubarWindow, 'menubar')
}

function showMenubarWindow(): void {
  if (!isMac || getAppMode() !== 'menubar') return

  if (!menubarWindow || menubarWindow.isDestroyed()) {
    createMenubarWindow()
  }

  if (!menubarWindow) return

  menubarWindow.webContents.send('app:reload-data')
  menubarWindow.webContents.send('app:show-notes')
  positionMenubarWindow()
  menubarWindow.show()
  menubarWindow.focus()
}

function toggleMenubarWindow(): void {
  if (!isMac || getAppMode() !== 'menubar') return

  if (!menubarWindow || menubarWindow.isDestroyed()) {
    createMenubarWindow()
  }

  if (!menubarWindow) return

  if (menubarWindow.isVisible()) {
    menubarWindow.hide()
    return
  }

  showMenubarWindow()
}

function openNormalAppWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow(true)
  }

  showMainWindow()
}

function destroyTray(): void {
  if (!tray) return
  tray.destroy()
  tray = null
}

function createTray(): void {
  if (!isMac || tray) return

  const trayIcon = nativeImage.createFromPath(getTrayIconPath()).resize({ width: 18, height: 18 })
  trayIcon.setTemplateImage(true)

  tray = new Tray(trayIcon)
  tray.setToolTip('Infinito')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Notes',
      click: () => showMenubarWindow()
    },
    {
      label: 'Open Normal App',
      click: () => openNormalAppWindow()
    },
    { type: 'separator' },
    {
      label: 'Switch to Normal App',
      click: () => {
        setAppMode('normal')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.on('click', () => {
    toggleMenubarWindow()
  })

  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu)
  })
}

function flushMenubarSaves(): Promise<void> {
  return new Promise((resolve) => {
    if (!menubarWindow || menubarWindow.isDestroyed()) {
      resolve()
      return
    }

    const sender = menubarWindow.webContents

    const finish = (): void => {
      clearTimeout(timeout)
      ipcMain.removeListener('blocks:flushed', onFlushed)
      resolve()
    }

    const onFlushed = (event: Electron.IpcMainEvent): void => {
      if (event.sender === sender) finish()
    }

    const timeout = setTimeout(finish, 2000)
    ipcMain.on('blocks:flushed', onFlushed)

    sender.send('app:flush-pending-saves')
  })
}

function setAppMode(mode: AppMode): Promise<AppMode> {
  if (!isMac) return Promise.resolve('normal')

  store.set('appMode', mode)

  const finish = (): AppMode => {
    if (mode === 'menubar') {
      createTray()
      createMenubarWindow()
      app.dock?.hide()
      mainWindow?.hide()

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:mode-changed', mode)
      }
      if (menubarWindow && !menubarWindow.isDestroyed()) {
        menubarWindow.webContents.send('app:mode-changed', mode)
      }

      return mode
    }

    destroyMenubarWindow()
    destroyTray()
    app.dock?.show()
    openNormalAppWindow()

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:mode-changed', mode)
    }

    return mode
  }

  if (mode === 'normal' && menubarWindow && !menubarWindow.isDestroyed()) {
    return flushMenubarSaves().then(() => finish())
  }

  return Promise.resolve(finish())
}

function createMainWindow(showOnReady: boolean): void {
  const iconPath = getIconPath()
  const icon = nativeImage.createFromPath(iconPath)

  if (isMac && !icon.isEmpty()) {
    app.dock?.setIcon(iconPath)
  }

  mainWindow = new BrowserWindow({
    icon,
    width: 450,
    height: 640,
    minWidth: 400,
    minHeight: 300,
    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset',
          transparent: true,
          backgroundColor: '#00000000'
        }
      : {
          frame: false,
          transparent: true,
          backgroundColor: '#00000000'
        }),
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--window-kind=main']
    }
  })

  registerWindowKind(mainWindow, 'main')

  if (!is.dev) {
    setMainWindow(mainWindow)
  }

  mainWindow.on('ready-to-show', () => {
    if (showOnReady) {
      mainWindow?.show()
    }
  })

  mainWindow.on('close', (event) => {
    if (isMac && getAppMode() === 'menubar' && !isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  secureWebContents(mainWindow)

  loadWindowContent(mainWindow, 'main')
}

function isBlockList(value: unknown): value is { id: string; content: string }[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.content === 'string'
    )
  )
}

function getTargetWindow(
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (getAppMode() === 'menubar') {
      showMenubarWindow()
      return
    }

    openNormalAppWindow()
  })

  app.on('window-all-closed', () => {
    if (!isMac) {
      closeDatabase()
      app.quit()
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    closeDatabase()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.infinito.app')

    initDatabase()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window, { zoom: true })
    })

    ipcMain.handle('toggle-pin', (event) => {
      const targetWindow = getTargetWindow(event)
      if (!targetWindow || targetWindow === menubarWindow) return false

      const pinned = targetWindow.isAlwaysOnTop()
      targetWindow.setAlwaysOnTop(!pinned)
      return !pinned
    })

    ipcMain.handle('db:get-blocks', () => {
      return blockRepository.findAll()
    })

    ipcMain.handle('db:save-blocks', (_event, blocks: unknown) => {
      if (!isBlockList(blocks)) {
        console.warn('[DB] Rejected db:save-blocks with invalid payload')
        return
      }
      blockRepository.saveAll(blocks)
    })

    ipcMain.on('close-window', (event) => {
      const targetWindow = getTargetWindow(event)
      targetWindow?.close()
    })

    ipcMain.on('minimize-window', (event) => {
      const targetWindow = getTargetWindow(event)
      if (!targetWindow) return

      if (targetWindow === menubarWindow) {
        targetWindow.hide()
        return
      }

      if (isMac && getAppMode() === 'menubar') {
        targetWindow.hide()
        return
      }

      targetWindow.minimize()
    })

    ipcMain.handle('maximize-window', (event) => {
      const targetWindow = getTargetWindow(event)
      if (!targetWindow || targetWindow === menubarWindow) return false

      if (targetWindow.isMaximized()) {
        targetWindow.unmaximize()
        return false
      }

      targetWindow.maximize()
      return true
    })

    ipcMain.handle('is-maximized', (event) => {
      const targetWindow = getTargetWindow(event)
      if (!targetWindow || targetWindow === menubarWindow) return false
      return targetWindow.isMaximized()
    })

    ipcMain.handle('app:get-version', () => {
      return app.getVersion()
    })

    ipcMain.handle('app:get-platform', () => {
      return process.platform
    })

    ipcMain.handle('app:get-window-kind', (event) => {
      return windowKinds.get(event.sender.id) ?? 'main'
    })

    ipcMain.handle('app:get-mode', () => {
      return getAppMode()
    })

    ipcMain.handle('app:set-mode', async (_event, mode: AppMode) => {
      if (mode !== 'normal' && mode !== 'menubar') {
        return getAppMode()
      }

      return setAppMode(mode)
    })

    ipcMain.handle('app:open-normal-window', async () => {
      await flushMenubarSaves()
      openNormalAppWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:reload-data')
      }
      return true
    })

    ipcMain.handle('app:open-external', (_event, url: string) => {
      return safeOpenExternal(url)
    })

    ipcMain.handle('update:check', () => {
      checkForUpdates()
      return true
    })

    ipcMain.handle('update:get-status', () => {
      return getUpdateStatus()
    })

    ipcMain.handle('update:restart', () => {
      forceRestart()
      return true
    })

    ipcMain.handle('update:snooze', () => {
      snoozeCriticalRestart()
      return true
    })

    ipcMain.handle('update:brew-upgrade', () => {
      runBrewUpgrade()
      return true
    })

    const initialMode = getAppMode()

    createMainWindow(initialMode === 'normal')

    if (mainWindow && !is.dev) {
      setupAutoUpdater(mainWindow, store)
      checkPendingUpdate()
      startPolling()
    }

    if (isMac) {
      setAppMode(initialMode)
    }

    app.on('activate', () => {
      if (getAppMode() === 'menubar') {
        showMenubarWindow()
        return
      }

      openNormalAppWindow()
    })
  })
}
