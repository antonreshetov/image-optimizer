export const IPC_CHANNELS = {
  optimizeFiles: 'optimizer:optimize-files',
  getSettings: 'settings:get-snapshot',
  updateSetting: 'settings:update',
  openExternal: 'app:open-external',
  fileComplete: 'optimizer:file-complete',
  optimizationStart: 'optimizer:optimization-start',
  optimizationComplete: 'optimizer:optimization-complete',
  jobTime: 'optimizer:job-time',
  menuPreferences: 'menu:preferences',
  dropFromDialog: 'optimizer:drop-from-dialog',
  getUpdateStatus: 'updater:get-status',
  checkForUpdates: 'updater:check',
  downloadUpdate: 'updater:download',
  installUpdate: 'updater:install',
  updateStatus: 'updater:status'
} as const

export interface DroppedFile {
  name: string
  path: string
  type: string
}

export interface FileSize {
  bytes: number
  readable: string
}

export interface FileOutput {
  name: string
  path: string
  originalSize: FileSize
  compressedSize: FileSize
  compressionPercentage: number
}

export interface AppSettings {
  addToSubfolder: boolean
  addMinSuffix: boolean
  clearResultList: boolean
  animationOnCompletion: boolean
  mozjpeg: {
    quality: number
  }
  pngquant: {
    qualityMin: number
    qualityMax: number
  }
  convertToWebp: boolean
}

export type SettingUpdate =
  | { key: 'addToSubfolder'; value: boolean }
  | { key: 'addMinSuffix'; value: boolean }
  | { key: 'clearResultList'; value: boolean }
  | { key: 'animationOnCompletion'; value: boolean }
  | { key: 'convertToWebp'; value: boolean }
  | { key: 'mozjpeg.quality'; value: number }
  | { key: 'pngquant.qualityMin'; value: number }
  | { key: 'pngquant.qualityMax'; value: number }

export type Unsubscribe = () => void

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export interface ElectronApi {
  getPathForFile(file: File): string
  optimizeFiles(files: DroppedFile[]): void
  getSettings(): Promise<AppSettings>
  updateSetting(update: SettingUpdate): Promise<void>
  openExternal(url: string): Promise<void>
  getUpdateStatus(): Promise<UpdateStatus>
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>
  onFileComplete(callback: (file: FileOutput) => void): Unsubscribe
  onOptimizationStart(callback: () => void): Unsubscribe
  onOptimizationComplete(callback: () => void): Unsubscribe
  onJobTime(callback: (time: string) => void): Unsubscribe
  onMenuPreferences(callback: () => void): Unsubscribe
  onDropFromDialog(callback: () => void): Unsubscribe
  onUpdateStatus(callback: (status: UpdateStatus) => void): Unsubscribe
}
