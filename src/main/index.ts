import { app, shell, BrowserWindow, ipcMain, nativeImage, Tray, Menu, screen } from 'electron'
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
const isLinux = process.platform === 'linux'
const supportsTray = isMac || isLinux

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
let trayMenu: Menu | null = null
let isQuitting = false
let menubarHiddenOnBlurAt = 0

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
  // The template icon is monochrome black, which is invisible on dark Linux panels
  if (!isMac) return getIconPath()

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
  if (!supportsTray) return 'normal'
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

  // Linux trays don't report bounds, so anchor to the cursor (which just clicked the icon)
  // and keep the window inside the work area. Wayland compositors ignore setPosition anyway.
  if (trayBounds.width === 0 || trayBounds.height === 0) {
    const cursor = screen.getCursorScreenPoint()
    const { workArea } = screen.getDisplayNearestPoint(cursor)
    const clamp = (value: number, min: number, max: number): number =>
      Math.round(Math.min(Math.max(value, min), max))

    const x = clamp(
      cursor.x - windowBounds.width / 2,
      workArea.x,
      workArea.x + workArea.width - windowBounds.width
    )
    const y = clamp(cursor.y + 6, workArea.y, workArea.y + workArea.height - windowBounds.height)

    menubarWindow.setPosition(x, y, false)
    return
  }

  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  const y = Math.round(trayBounds.y + trayBounds.height + 6)

  menubarWindow.setPosition(x, y, false)
}

function createMenubarWindow(): void {
  if (!supportsTray || menubarWindow) return

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
      menubarHiddenOnBlurAt = Date.now()
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
  if (!supportsTray || getAppMode() !== 'menubar') return

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
  if (!supportsTray || getAppMode() !== 'menubar') return

  if (!menubarWindow || menubarWindow.isDestroyed()) {
    createMenubarWindow()
  }

  if (!menubarWindow) return

  if (menubarWindow.isVisible()) {
    menubarWindow.hide()
    return
  }

  // Clicking the tray icon blurs the window first (hiding it); don't reopen it right away
  if (Date.now() - menubarHiddenOnBlurAt < 300) return

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
  trayMenu = null
}

function quitApp(): void {
  isQuitting = true
  app.quit()
}

function buildTrayMenu(mode: AppMode): Menu {
  if (mode === 'normal') {
    return Menu.buildFromTemplate([
      {
        label: 'Open Infinito',
        click: () => openNormalAppWindow()
      },
      { type: 'separator' },
      {
        label: 'Switch to Menu Bar App',
        click: () => {
          setAppMode('menubar')
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: quitApp }
    ])
  }

  return Menu.buildFromTemplate([
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
    { label: 'Quit', click: quitApp }
  ])
}

function updateTrayMenu(): void {
  if (!tray) return

  trayMenu = buildTrayMenu(getAppMode())

  // Linux (StatusNotifierItem) has no right-click event; the panel shows the menu itself
  if (!isMac) {
    tray.setContextMenu(trayMenu)
  }
}

function createTray(): void {
  if (!supportsTray || tray) return

  const trayIconSize = isMac ? 18 : 22
  const trayIcon = nativeImage
    .createFromPath(getTrayIconPath())
    .resize({ width: trayIconSize, height: trayIconSize })
  trayIcon.setTemplateImage(isMac)

  tray = new Tray(trayIcon)
  tray.setToolTip('Infinito')

  tray.on('click', () => {
    if (getAppMode() === 'menubar') {
      toggleMenubarWindow()
      return
    }

    openNormalAppWindow()
  })

  if (isMac) {
    tray.on('right-click', () => {
      if (trayMenu) tray?.popUpContextMenu(trayMenu)
    })
  }
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
  if (!supportsTray) return Promise.resolve('normal')

  store.set('appMode', mode)

  const finish = (): AppMode => {
    if (mode === 'menubar') {
      createTray()
      updateTrayMenu()
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

    // Linux keeps a single tray for the whole process: Chromium can't re-register the
    // StatusNotifierItem on D-Bus after destroying it, so a recreated tray stops responding
    if (isLinux) {
      createTray()
      updateTrayMenu()
    } else {
      destroyTray()
    }

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
    if (supportsTray && getAppMode() === 'menubar' && !isQuitting) {
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

      if (supportsTray && getAppMode() === 'menubar') {
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

    if (supportsTray) {
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
