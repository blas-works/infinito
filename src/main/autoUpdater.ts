import { dialog, shell, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import type Store from 'electron-store'
import type { StoreSchema } from './index'
import type { UpdateInfo, UpdateMetadata, UpdatePriority, PendingUpdate } from '../shared/types'

const RELEASE_URL = 'https://github.com/torrescereno/infinito/releases/latest'
const METADATA_URL =
  'https://github.com/torrescereno/infinito/releases/latest/download/update-metadata.json'

const isMacOS = process.platform === 'darwin'
const canAutoUpdate = process.platform !== 'linux' || !!process.env.APPIMAGE

const POLL_INTERVALS = {
  normal: 60 * 60 * 1000,
  security: 15 * 60 * 1000,
  critical: 5 * 60 * 1000
} as const

let mainWindowRef: BrowserWindow | null = null
let storeRef: Store<StoreSchema> | null = null
let checkInterval: NodeJS.Timeout | null = null
let snoozeTimeout: NodeJS.Timeout | null = null
let lastPriority: UpdatePriority = 'normal'
let updateDownloaded = false
let lastStatus: UpdateInfo = { available: false }

export function setupAutoUpdater(mainWindow: BrowserWindow, store: Store<StoreSchema>): void {
  if (is.dev) return

  mainWindowRef = mainWindow
  storeRef = store

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('update-available', (info) => {
    if (!canAutoUpdate) {
      showLinuxManualUpdateDialog(info.version)
      return
    }

    handleUpdateAvailable(info.version)
  })

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({ available: false })
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    sendUpdateStatus({
      ...lastStatus,
      progress: percent,
      downloaded: false
    })
  })

  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true

    const pending: PendingUpdate = {
      version: lastStatus.version!,
      priority: lastStatus.priority || 'normal',
      message: lastStatus.message
    }
    storeRef?.set('pendingUpdate', pending)

    sendUpdateStatus({
      ...lastStatus,
      progress: 100,
      downloaded: true
    })
  })

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error.message)
    sendUpdateStatus({ available: false })
  })
}

export function checkPendingUpdate(): void {
  if (is.dev || !storeRef) return

  if (isMacOS) {
    storeRef.delete('pendingUpdate')
    return
  }

  const pending = storeRef.get('pendingUpdate')
  if (!pending) return

  lastPriority = pending.priority
  updateDownloaded = true

  lastStatus = {
    available: true,
    version: pending.version,
    priority: pending.priority,
    message: pending.message,
    progress: 100,
    downloaded: true
  }

  sendUpdateStatus(lastStatus)
}

async function handleUpdateAvailable(version: string): Promise<void> {
  const metadata = await fetchUpdateMetadata()
  const priority = metadata?.priority || 'normal'
  const previousPriority = lastPriority

  lastPriority = priority
  updateDownloaded = false

  lastStatus = {
    available: true,
    version,
    priority,
    message: metadata?.message,
    progress: 0,
    downloaded: false,
    manualDownload: isMacOS
  }

  sendUpdateStatus(lastStatus)

  if (isMacOS) {
    showMacOSManualUpdateDialog(version, priority)
    return
  }

  autoUpdater.downloadUpdate()

  if (previousPriority !== priority && checkInterval) {
    startPolling()
  }
}

async function fetchUpdateMetadata(): Promise<UpdateMetadata | null> {
  try {
    const response = await fetch(METADATA_URL)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.warn('Could not fetch update metadata:', error)
    return null
  }
}

function showLinuxManualUpdateDialog(version: string): void {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update available',
      message: `A new version (${version}) is available. Please download it manually.`,
      buttons: ['Download now', 'Remind later']
    })
    .then((result) => {
      if (result.response === 0) {
        shell.openExternal(RELEASE_URL)
      }
    })
}

function showMacOSManualUpdateDialog(version: string, priority: UpdatePriority): void {
  const titleMap: Record<UpdatePriority, string> = {
    normal: 'Update available',
    security: 'Security update available',
    critical: 'Critical update available'
  }

  const noteMap: Record<UpdatePriority, string> = {
    normal: '',
    security: '\n\nThis is a security update. Please update as soon as possible.',
    critical: '\n\nThis is a critical update. Please update immediately.'
  }

  dialog
    .showMessageBox({
      type: priority === 'critical' ? 'warning' : 'info',
      title: titleMap[priority],
      message: `A new version (${version}) is available.${noteMap[priority]}`,
      detail: 'Automatic updates are not available on macOS. Please download the update manually.',
      buttons: ['Download now', 'Remind later']
    })
    .then((result) => {
      if (result.response === 0) {
        shell.openExternal(RELEASE_URL)
      }
    })
}

function sendUpdateStatus(status: UpdateInfo): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('update-status', status)
  }
}

export function setMainWindow(window: BrowserWindow): void {
  mainWindowRef = window
}

export function checkForUpdates(): void {
  if (is.dev) return

  try {
    autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

export function startPolling(): void {
  if (is.dev) return

  checkForUpdates()

  const interval = POLL_INTERVALS[lastPriority] || POLL_INTERVALS.normal

  if (checkInterval) {
    clearInterval(checkInterval)
  }

  checkInterval = setInterval(() => {
    checkForUpdates()
  }, interval)
}

export function stopPolling(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

export function getUpdateStatus(): UpdateInfo {
  return {
    ...lastStatus,
    downloaded: updateDownloaded
  }
}

export function forceRestart(): void {
  if (updateDownloaded) {
    storeRef?.set('pendingUpdate', null)
    autoUpdater.quitAndInstall()
  }
}

export function snoozeCriticalRestart(): void {
  if (snoozeTimeout) {
    clearTimeout(snoozeTimeout)
  }

  snoozeTimeout = setTimeout(
    () => {
      snoozeTimeout = null
      sendUpdateStatus({
        ...lastStatus,
        downloaded: updateDownloaded
      })
    },
    5 * 60 * 1000
  )
}
