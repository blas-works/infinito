import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  togglePin: (): Promise<boolean> => ipcRenderer.invoke('toggle-pin'),
  closeWindow: (): void => ipcRenderer.send('close-window'),
  minimizeWindow: (): void => ipcRenderer.send('minimize-window'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('maximize-window'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-maximized'),
  getBlocks: (): Promise<{ id: string; content: string; position: number }[]> =>
    ipcRenderer.invoke('db:get-blocks'),
  saveBlocks: (blocks: { id: string; content: string }[]): Promise<void> =>
    ipcRenderer.invoke('db:save-blocks', blocks)
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
