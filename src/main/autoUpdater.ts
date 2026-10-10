import { app, dialog, shell, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import {
  accessSync,
  appendFileSync,
  chmodSync,
  constants as fsConstants,
  mkdirSync,
  writeFileSync
} from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import type Store from 'electron-store'
import type { StoreSchema } from './index'
import type { UpdateInfo, UpdateMetadata, UpdatePriority, PendingUpdate } from '../shared/types'

const RELEASE_URL = 'https://github.com/blas-works/infinito/releases/latest'
const METADATA_URL =
  'https://github.com/blas-works/infinito/releases/latest/download/update-metadata.json'

const BREW_CASK = 'infinito'
const BREW_BUNDLE_ID = 'com.infinito.app'
const BREW_PATHS = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
const BREW_UPDATE_TIMEOUT = 3 * 60 * 1000
const BREW_UPGRADE_TIMEOUT = 10 * 60 * 1000
const BREW_INFO_TIMEOUT = 60 * 1000

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
let brewInProgress = false

export function setupAutoUpdater(mainWindow: BrowserWindow, store: Store<StoreSchema>): void {
  if (is.dev) return

  mainWindowRef = mainWindow
  storeRef = store

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    if (brewInProgress) return

    if (process.platform === 'darwin') {
      handleBrewUpdateAvailable(info.version)
      return
    }

    if (!canAutoUpdate) {
      showLinuxManualUpdateDialog(info.version)
      return
    }

    handleUpdateAvailable(info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] No updates available')
    if (brewInProgress) return
    storeRef?.set('pendingUpdate', null)
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
    // A failed background check must not wipe the brew progress/error the user is looking at
    if (brewInProgress || lastStatus.brewUpdate) return
    sendUpdateStatus({ available: false })
  })
}

export function checkPendingUpdate(): void {
  if (is.dev || !storeRef || process.platform === 'darwin') return

  const pending = storeRef.get('pendingUpdate')
  if (!pending) return

  if (pending.version === app.getVersion()) {
    console.log(
      '[AutoUpdater] Pending update version matches current app version, clearing stale pending update'
    )
    storeRef.set('pendingUpdate', null)
    return
  }

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
    downloaded: false
  }

  sendUpdateStatus(lastStatus)

  console.log('[AutoUpdater] Starting update download')
  autoUpdater.downloadUpdate()

  if (previousPriority !== priority && checkInterval) {
    startPolling()
  }
}

async function handleBrewUpdateAvailable(version: string): Promise<void> {
  console.log('[AutoUpdater] Brew update available:', version)
  const metadata = await fetchUpdateMetadata()
  const priority = metadata?.priority || 'normal'

  lastPriority = priority
  lastStatus = {
    available: true,
    version,
    priority,
    message: metadata?.message,
    brewUpdate: true
  }

  sendUpdateStatus(lastStatus)
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

function showLinuxManualUpdateDialog(version: string): void {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update available',
      message: `A new version (${version}) is available.`,
      detail:
        'Automatic updates are only supported for AppImage installations. Please download the update manually.',
      buttons: ['Download now', 'Later']
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
  if (is.dev || brewInProgress) return

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

export async function runBrewUpgrade(): Promise<void> {
  if (process.platform !== 'darwin' || brewInProgress) return

  brewInProgress = true
  logUpdate(`Starting brew upgrade to v${lastStatus.version ?? 'unknown'}`)
  setBrewStatus({ brewUpdating: true, brewStep: 'preparing', brewError: undefined })

  const brewPath = BREW_PATHS.find((p) => {
    try {
      accessSync(p, fsConstants.X_OK)
      return true
    } catch {
      return false
    }
  })

  if (!brewPath) {
    failBrewUpgrade('Homebrew not found')
    return
  }

  try {
    await runBrewSteps(brewPath)
  } catch (error) {
    failBrewUpgrade(`Update failed: ${(error as Error).message}`)
  }
}

async function runBrewSteps(brewPath: string): Promise<void> {
  const targetVersion = lastStatus.version

  setBrewStatus({ brewStep: 'updating-brew' })
  const update = await runBrew(brewPath, ['update'], BREW_UPDATE_TIMEOUT)
  // A broken unrelated tap makes `brew update` exit non-zero while our tap is still refreshed,
  // so it must not abort the upgrade
  if (update.code !== 0) {
    logUpdate(`brew update exited with ${update.code}${update.timedOut ? ' (timed out)' : ''}`)
  }

  const before = await getCaskVersions(brewPath)
  if (!before?.installed) {
    shell.openExternal(RELEASE_URL)
    failBrewUpgrade('Infinito was not installed with Homebrew. Download the update manually.')
    return
  }

  // The app learns about a release from GitHub before the tap is bumped by CI; upgrading now
  // would be a no-op that relaunches the same version
  if (targetVersion && before.latest && isOlderVersion(before.latest, targetVersion)) {
    failBrewUpgrade(`v${targetVersion} is not on Homebrew yet. Try again in a few minutes.`)
    return
  }

  setBrewStatus({ brewStep: 'downloading' })
  const upgrade = await runBrew(
    brewPath,
    ['upgrade', '--cask', BREW_CASK],
    BREW_UPGRADE_TIMEOUT,
    (chunk) => {
      if (/==> (Backing|Moving|Installing|Removing|Purging)/.test(chunk)) {
        setBrewStatus({ brewStep: 'installing' })
      }
    }
  )

  if (upgrade.timedOut) {
    failBrewUpgrade(`Update timed out. See ${getUpdateLogPath()}`)
    return
  }

  if (upgrade.code !== 0) {
    fallbackToBackgroundScript(brewPath)
    return
  }

  const after = await getCaskVersions(brewPath)
  if (targetVersion && after?.installed && isOlderVersion(after.installed, targetVersion)) {
    failBrewUpgrade(`Homebrew did not install v${targetVersion}. See ${getUpdateLogPath()}`)
    return
  }

  setBrewStatus({ brewStep: 'restarting' })
  storeRef?.set('pendingUpdate', null)
  logUpdate('Upgrade finished, relaunching')

  setTimeout(() => {
    app.relaunch()
    app.quit()
    // Never leave the user on the overlay if something vetoes the quit
    setTimeout(() => app.exit(0), 5000)
  }, 1000)
}

interface BrewResult {
  code: number | null
  output: string
  timedOut: boolean
}

function runBrew(
  brewPath: string,
  args: string[],
  timeoutMs: number,
  onOutput?: (chunk: string) => void
): Promise<BrewResult> {
  logUpdate(`$ brew ${args.join(' ')}`)

  return new Promise((resolve) => {
    let output = ''
    let timedOut = false
    let settled = false

    const child = spawn(brewPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: getBrewEnv(brewPath)
    })

    const finish = (code: number | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ code, output, timedOut })
    }

    const timer = setTimeout(() => {
      timedOut = true
      logUpdate(`brew ${args[0]} timed out after ${timeoutMs / 1000}s`)
      child.kill('SIGTERM')
      finish(null)
    }, timeoutMs)

    const onData = (data: Buffer): void => {
      const chunk = data.toString()
      output += chunk
      logUpdate(chunk.trimEnd())
      onOutput?.(chunk)
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', (error) => {
      logUpdate(`Failed to run brew: ${error.message}`)
      finish(null)
    })
    child.on('close', (code) => finish(code))
  })
}

// GUI apps on macOS get a minimal environment, and brew's auto-update and cleanup can take
// minutes, which is what made the update look stuck on "Downloading"
function getBrewEnv(brewPath: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${dirname(brewPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOMEBREW_NO_AUTO_UPDATE: '1',
    HOMEBREW_NO_INSTALL_CLEANUP: '1',
    HOMEBREW_NO_ENV_HINTS: '1',
    HOMEBREW_NO_ANALYTICS: '1',
    NONINTERACTIVE: '1'
  }
}

async function getCaskVersions(
  brewPath: string
): Promise<{ installed: string | null; latest: string | null } | null> {
  const result = await runBrew(
    brewPath,
    ['info', '--cask', '--json=v2', BREW_CASK],
    BREW_INFO_TIMEOUT
  )
  if (result.code !== 0) return null

  try {
    const json = result.output.slice(result.output.indexOf('{'))
    const cask = JSON.parse(json).casks?.[0]
    if (!cask) return null
    return {
      installed: typeof cask.installed === 'string' ? cask.installed : null,
      latest: typeof cask.version === 'string' ? cask.version : null
    }
  } catch {
    return null
  }
}

function isOlderVersion(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff < 0
  }
  return false
}

function setBrewStatus(patch: Partial<UpdateInfo>): void {
  lastStatus = { ...lastStatus, ...patch }
  sendUpdateStatus(lastStatus)
}

function failBrewUpgrade(message: string): void {
  logUpdate(`Brew upgrade failed: ${message}`)
  brewInProgress = false
  setBrewStatus({ brewUpdating: false, brewStep: undefined, brewError: message })
}

function getUpdateLogPath(): string {
  return join(app.getPath('logs'), 'update.log')
}

function logUpdate(message: string): void {
  console.log('[AutoUpdater]', message)
  try {
    const logPath = getUpdateLogPath()
    mkdirSync(dirname(logPath), { recursive: true })
    appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    // Logging must never break the update flow
  }
}

// Last resort when brew fails while the app is running: quit and let a detached script retry
function fallbackToBackgroundScript(brewPath: string): void {
  logUpdate('Falling back to background update script')

  const scriptContent = [
    '#!/bin/bash',
    `exec >> "${getUpdateLogPath()}" 2>&1`,
    'echo "Starting Infinito fallback update at $(date)"',
    'export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1 NONINTERACTIVE=1',
    'sleep 3',
    `"${brewPath}" upgrade --cask ${BREW_CASK}`,
    'echo "Reopening Infinito..."',
    'sleep 1',
    `open -b ${BREW_BUNDLE_ID}`,
    'rm -f "$0"'
  ].join('\n')

  const scriptPath = join(tmpdir(), 'infinito-update.sh')
  writeFileSync(scriptPath, scriptContent)
  chmodSync(scriptPath, 0o755)

  spawn('bash', ['-c', `nohup "${scriptPath}" >/dev/null 2>&1 &`], {
    detached: true,
    stdio: 'ignore'
  }).unref()

  setBrewStatus({ brewStep: 'restarting' })
  storeRef?.set('pendingUpdate', null)

  setTimeout(() => {
    app.quit()
    setTimeout(() => app.exit(0), 5000)
  }, 500)
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
