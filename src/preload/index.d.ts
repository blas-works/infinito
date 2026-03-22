import { ElectronAPI } from '@electron-toolkit/preload'

interface BlockData {
  id: string
  content: string
  position: number
}

interface UpdateStatusInfo {
  available: boolean
  version?: string
  priority?: 'normal' | 'security' | 'critical'
  message?: string
  progress?: number
  downloaded?: boolean
  manualDownload?: boolean
}

interface UpdateAPI {
  check: () => Promise<boolean>
  getStatus: () => Promise<UpdateStatusInfo>
  restart: () => Promise<boolean>
  snooze: () => Promise<boolean>
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
  openExternal: (url: string) => Promise<boolean>
  update: UpdateAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: InfinitoAPI
  }
}
