import { ElectronAPI } from '@electron-toolkit/preload'

interface BlockData {
  id: string
  content: string
  position: number
}

type AppMode = 'normal' | 'menubar'
type WindowKind = 'main' | 'menubar'

interface UpdateStatusInfo {
  available: boolean
  version?: string
  priority?: 'normal' | 'security' | 'critical'
  message?: string
  progress?: number
  downloaded?: boolean
  manualDownload?: boolean
  dmgDownloadProgress?: number
  dmgDownloaded?: boolean
  dmgPath?: string
}

interface UpdateAPI {
  check: () => Promise<boolean>
  getStatus: () => Promise<UpdateStatusInfo>
  restart: () => Promise<boolean>
  snooze: () => Promise<boolean>
  openDMG: () => Promise<boolean>
  onStatus: (callback: (status: UpdateStatusInfo) => void) => () => void
}

interface InfinitoAPI {
  togglePin: () => Promise<boolean>
  closeWindow: () => void
  minimizeWindow: () => void
  maximizeWindow: () => Promise<boolean>
  isMaximized: () => Promise<boolean>
  getBlocks: () => Promise<BlockData[]>
  saveBlocks: (blocks: { id: string; content: string }[]) => Promise<void>
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
  getWindowKind: () => Promise<WindowKind>
  getAppMode: () => Promise<AppMode>
  setAppMode: (mode: AppMode) => Promise<AppMode>
  openNormalWindow: () => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  onShowNotes: (callback: () => void) => () => void
  onAppModeChanged: (callback: (mode: AppMode) => void) => () => void
  update: UpdateAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: InfinitoAPI
  }
}
