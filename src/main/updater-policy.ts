export const isManagedUpdateSupported = (
  isPackaged: boolean,
  platform: NodeJS.Platform
) => isPackaged && (platform === 'darwin' || platform === 'win32')

export const canDownloadUpdate = (state: string) => state === 'available'

export const canInstallUpdate = (state: string) => state === 'downloaded'
