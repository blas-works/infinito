import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
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
  snoozeCriticalRestart
} from './autoUpdater'
import type { PendingUpdate } from '../shared/types'

export interface StoreSchema {
  pendingUpdate: PendingUpdate | null
}

const store = new Store<StoreSchema>({
  defaults: {
    pendingUpdate: null
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const iconPath = is.dev
    ? join(__dirname, '../../resources/icon.png')
    : join(process.resourcesPath, 'icon.png')

  const icon = nativeImage.createFromPath(iconPath)

  if (process.platform === 'darwin' && !icon.isEmpty()) {
    app.dock?.setIcon(iconPath)
  }

  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    icon,
    width: 420,
    height: 640,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    transparent: true,
    ...(isMac ? {} : { titleBarStyle: 'hidden', titleBarOverlay: false }),
    backgroundColor: '#00000000',
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      closeDatabase()
      app.quit()
    }
  })

  app.on('before-quit', () => {
    closeDatabase()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.infinito.app')

    initDatabase()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    ipcMain.handle('toggle-pin', () => {
      if (!mainWindow) return false
      const isPinned = mainWindow.isAlwaysOnTop()
      mainWindow.setAlwaysOnTop(!isPinned)
      return !isPinned
    })

    ipcMain.handle('db:get-blocks', () => {
      return blockRepository.findAll()
    })

    ipcMain.handle('db:save-blocks', (_event, blocks: { id: string; content: string }[]) => {
      blockRepository.saveAll(blocks)
    })

    ipcMain.on('close-window', () => {
      mainWindow?.close()
    })

    ipcMain.on('minimize-window', () => {
      mainWindow?.minimize()
    })

    ipcMain.handle('maximize-window', () => {
      if (!mainWindow) return false
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
        return false
      } else {
        mainWindow.maximize()
        return true
      }
    })

    ipcMain.handle('is-maximized', () => {
      return mainWindow?.isMaximized() ?? false
    })

    ipcMain.handle('app:get-version', () => {
      return app.getVersion()
    })

    ipcMain.handle('app:open-external', (_event, url: string) => {
      shell.openExternal(url)
      return true
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

    createWindow()

    if (mainWindow && !is.dev) {
      setupAutoUpdater(mainWindow, store)
      checkPendingUpdate()
      startPolling()
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        if (mainWindow && !is.dev) {
          setMainWindow(mainWindow)
        }
      }
    })
  })
}
