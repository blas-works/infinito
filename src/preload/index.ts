import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type AppMode = 'normal' | 'menubar'
type WindowKind = 'main' | 'menubar'

const api = {
  togglePin: (): Promise<boolean> => ipcRenderer.invoke('toggle-pin'),
  closeWindow: (): void => ipcRenderer.send('close-window'),
  minimizeWindow: (): void => ipcRenderer.send('minimize-window'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('maximize-window'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-maximized'),
  getBlocks: (): Promise<{ id: string; content: string; position: number }[]> =>
    ipcRenderer.invoke('db:get-blocks'),
  saveBlocks: (blocks: { id: string; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('db:save-blocks', blocks),
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('app:get-platform'),
  getWindowKind: (): Promise<WindowKind> => ipcRenderer.invoke('app:get-window-kind'),
  getAppMode: (): Promise<AppMode> => ipcRenderer.invoke('app:get-mode'),
  setAppMode: (mode: AppMode): Promise<AppMode> => ipcRenderer.invoke('app:set-mode', mode),
  openNormalWindow: (): Promise<boolean> => ipcRenderer.invoke('app:open-normal-window'),
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('app:open-external', url),
  onShowNotes: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('app:show-notes', handler)
    return (): void => {
      ipcRenderer.removeListener('app:show-notes', handler)
    }
  },
  onAppModeChanged: (callback: (mode: AppMode) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: AppMode): void => callback(mode)
    ipcRenderer.on('app:mode-changed', handler)
    return (): void => {
      ipcRenderer.removeListener('app:mode-changed', handler)
    }
  },
  update: {
    check: (): Promise<boolean> => ipcRenderer.invoke('update:check'),
    getStatus: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('update:get-status'),
    restart: (): Promise<boolean> => ipcRenderer.invoke('update:restart'),
    snooze: (): Promise<boolean> => ipcRenderer.invoke('update:snooze'),
    openDMG: (): Promise<boolean> => ipcRenderer.invoke('update:open-dmg'),
    onStatus: (callback: (_status: Record<string, unknown>) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: Record<string, unknown>): void =>
        callback(status)
      ipcRenderer.on('update-status', handler)
      return (): void => {
        ipcRenderer.removeListener('update-status', handler)
      }
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
