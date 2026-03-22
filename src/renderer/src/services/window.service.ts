export const windowService = {
  togglePin: (): Promise<boolean> => window.api.togglePin(),
  close: (): void => window.api.closeWindow(),
  minimize: (): void => window.api.minimizeWindow(),
  maximize: async (): Promise<boolean> => {
    const result = await window.api.maximizeWindow()
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
    return result
  },
  isMaximized: (): Promise<boolean> => window.api.isMaximized()
}
