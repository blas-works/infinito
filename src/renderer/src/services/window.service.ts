export const windowService = {
  togglePin: (): Promise<boolean> => window.api.togglePin(),
  close: (): void => window.api.closeWindow(),
  minimize: (): void => window.api.minimizeWindow()
}
