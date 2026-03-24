export const windowService = {
  togglePin: (): Promise<boolean> => window.api.togglePin(),
  close: (): void => window.api.closeWindow(),
  minimize: (): void => window.api.minimizeWindow(),
  getPlatform: (): Promise<NodeJS.Platform> => window.api.getPlatform(),
  getWindowKind: (): Promise<'main' | 'menubar'> => window.api.getWindowKind(),
  getAppMode: (): Promise<'normal' | 'menubar'> => window.api.getAppMode(),
  setAppMode: (mode: 'normal' | 'menubar'): Promise<'normal' | 'menubar'> =>
    window.api.setAppMode(mode),
  openNormalWindow: (): Promise<boolean> => window.api.openNormalWindow(),
  maximize: async (): Promise<boolean> => {
    const result = await window.api.maximizeWindow()
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
    return result
  },
  isMaximized: (): Promise<boolean> => window.api.isMaximized()
}
