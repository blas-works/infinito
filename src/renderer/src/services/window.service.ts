export const windowService = {
  togglePin: (): Promise<boolean> => window.api.togglePin(),
  close: (): void => window.api.closeWindow(),
  minimize: (): void => window.api.minimizeWindow(),
  maximize: (): Promise<boolean> => window.api.maximizeWindow(),
  isMaximized: (): Promise<boolean> => window.api.isMaximized()
}
