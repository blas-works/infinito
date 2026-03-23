import { dialog, shell, BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { download } from 'electron-dl'
import { is } from '@electron-toolkit/utils'
import type Store from 'electron-store'
import type { StoreSchema } from './index'
import type { UpdateInfo, UpdateMetadata, UpdatePriority, PendingUpdate } from '../shared/types'

const RELEASE_URL = 'https://github.com/torrescereno/infinito/releases/latest'
const METADATA_URL =
  'https://github.com/torrescereno/infinito/releases/latest/download/update-metadata.json'

const isWindows = process.platform === 'win32'
const isMacOS = process.platform === 'darwin'

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
  autoUpdater.autoInstallOnAppQuit = isWindows

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    handleUpdateAvailable(info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] No updates available')
    sendUpdateStatus({ available: false })
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    console.log('[AutoUpdater] Download progress:', percent + '%')
    sendUpdateStatus({
      ...lastStatus,
      progress: percent,
      downloaded: false
    })
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('[AutoUpdater] Update downloaded')
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
    console.error('[AutoUpdater] Error:', error.message)
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
  console.log('[AutoUpdater] Handling update available for version:', version)

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
    downloadDMG(version, priority)
    return
  }

  if (isWindows) {
    console.log('[AutoUpdater] Starting Windows update download')
    autoUpdater.downloadUpdate()
  }

  if (previousPriority !== priority && checkInterval) {
    startPolling()
  }
}

async function downloadDMG(version: string, priority: UpdatePriority): Promise<void> {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return

  try {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
    const dmgUrl = `https://github.com/torrescereno/infinito/releases/download/v${version}/infinito-${version}-${arch}.dmg`

    console.log('[AutoUpdater] Downloading DMG from:', dmgUrl)

    const dl = await download(mainWindowRef, dmgUrl, {
      directory: app.getPath('downloads'),
      filename: `infinito-${version}-${arch}.dmg`,
      onProgress: (progress) => {
        const percent = Math.round(progress.percent * 100)
        console.log('[AutoUpdater] DMG download progress:', percent + '%')
        sendUpdateStatus({
          ...lastStatus,
          dmgDownloadProgress: percent,
          dmgDownloaded: false
        })
      }
    })

    const dmgPath = dl.getSavePath()
    console.log('[AutoUpdater] DMG downloaded to:', dmgPath)

    lastStatus = {
      ...lastStatus,
      dmgDownloadProgress: 100,
      dmgDownloaded: true,
      dmgPath
    }
    sendUpdateStatus(lastStatus)

    showMacOSDMGReadyDialog(version, priority, dmgPath)
  } catch (error) {
    console.error('[AutoUpdater] Failed to download DMG:', error)
    showMacOSManualUpdateDialog(version, priority)
  }
}

function showMacOSDMGReadyDialog(version: string, priority: UpdatePriority, dmgPath: string): void {
  const titleMap: Record<UpdatePriority, string> = {
    normal: 'Update ready',
    security: 'Security update ready',
    critical: 'Critical update ready'
  }

  dialog
    .showMessageBox({
      type: priority === 'critical' ? 'warning' : 'info',
      title: titleMap[priority],
      message: `Version ${version} has been downloaded.`,
      detail: `The DMG file is in your Downloads folder. Would you like to open it now?`,
      buttons: ['Open DMG', 'Later']
    })
    .then((result) => {
      if (result.response === 0) {
        shell.openPath(dmgPath)
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
      detail: 'Automatic downloads are not available. Please download the update manually.',
      buttons: ['Download now', 'Remind later']
    })
    .then((result) => {
      if (result.response === 0) {
        shell.openExternal(RELEASE_URL)
      }
    })
}

async function fetchUpdateMetadata(): Promise<UpdateMetadata | null> {
  try {
    const response = await fetch(METADATA_URL)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.warn('[AutoUpdater] Could not fetch update metadata:', error)
    return null
  }
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
    console.log('[AutoUpdater] Checking for updates...')
    autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('[AutoUpdater] Failed to check for updates:', error)
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

export function openDMG(): void {
  if (lastStatus.dmgPath) {
    shell.openPath(lastStatus.dmgPath)
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
