import { ElectronAPI } from '@electron-toolkit/preload'

interface BlockData {
  id: string
  content: string
  position: number
}

interface InfinitoAPI {
  togglePin: () => Promise<boolean>
  closeWindow: () => void
  minimizeWindow: () => void
  getBlocks: () => Promise<BlockData[]>
  saveBlocks: (blocks: { id: string; content: string }[]) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: InfinitoAPI
  }
}
