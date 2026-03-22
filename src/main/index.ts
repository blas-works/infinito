import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from '../database/client'
import { blockRepository } from '../database/repositories'
import {
  setupAutoUpdater,
  startPolling,
  checkForUpdates,
  getUpdateStatus,
  forceRestart,
  snoozeCriticalRestart
} from './autoUpdater'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#09090b',
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

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

  if (mainWindow) {
    setupAutoUpdater(mainWindow)
    startPolling()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
