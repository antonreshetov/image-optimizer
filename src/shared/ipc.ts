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
  menuToggleInspector: 'menu:toggle-inspector',
  showFileContextMenu: 'menu:file-context',
  dropFromDialog: 'optimizer:drop-from-dialog',
  getUpdateStatus: 'updater:get-status',
  checkForUpdates: 'updater:check',
  downloadUpdate: 'updater:download',
  installUpdate: 'updater:install',
  updateStatus: 'updater:status',
  getImagePreview: 'preview:get-image',
  revealOutput: 'output:reveal',
  chooseFiles: 'optimizer:choose-files',
  prepareFiles: 'optimizer:prepare-files',
  fileFailed: 'optimizer:file-failed',
  openComparison: 'comparison:open',
  getComparisonPayload: 'comparison:get-payload'
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

export interface OptimizationInput extends DroppedFile {
  originalSize: FileSize
}

export interface FileFailure {
  path: string
  message: string
}

export interface FileOutput {
  name: string
  path: string
  outputPath: string
  originalSize: FileSize
  compressedSize: FileSize
  compressionPercentage: number
}

export interface ComparisonRequest {
  path: string
  outputPath: string
}

export type ComparisonPayload = Omit<FileOutput, 'compressionPercentage'>

export interface AppSettings {
  stripMetadata: boolean
  outputDirectoryName: string
  addToSubfolder: boolean
  addMinSuffix: boolean
  clearResultList: boolean
  animationOnCompletion: boolean
  mozjpeg: {
    quality: number
  }
  pngQuality: number
  convertToWebp: boolean
}

export type SettingUpdate =
  | { key: 'stripMetadata'; value: boolean }
  | { key: 'outputDirectoryName'; value: string }
  | { key: 'addToSubfolder'; value: boolean }
  | { key: 'addMinSuffix'; value: boolean }
  | { key: 'clearResultList'; value: boolean }
  | { key: 'animationOnCompletion'; value: boolean }
  | { key: 'convertToWebp'; value: boolean }
  | { key: 'mozjpeg.quality'; value: number }
  | { key: 'pngQuality'; value: number }

export type Unsubscribe = () => void
export type FileContextAction = 'remove' | null
export type AppPlatform = 'darwin' | 'win32' | 'linux' | 'other'

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export interface ElectronApi {
  platform: AppPlatform
  getPathForFile(file: File): string
  optimizeFiles(files: DroppedFile[]): void
  getSettings(): Promise<AppSettings>
  updateSetting(update: SettingUpdate): Promise<void>
  openExternal(url: string): Promise<void>
  getUpdateStatus(): Promise<UpdateStatus>
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>
  getImagePreview(path: string): Promise<string>
  revealOutput(path: string): Promise<void>
  chooseFiles(): Promise<DroppedFile[]>
  prepareFiles(files: DroppedFile[]): Promise<OptimizationInput[]>
  showFileContextMenu(removeEnabled: boolean): Promise<FileContextAction>
  openComparison(request: ComparisonRequest): Promise<void>
  getComparisonPayload(): Promise<ComparisonPayload>
  onFileComplete(callback: (file: FileOutput) => void): Unsubscribe
  onFileFailed(callback: (failure: FileFailure) => void): Unsubscribe
  onOptimizationStart(callback: () => void): Unsubscribe
  onOptimizationComplete(callback: () => void): Unsubscribe
  onJobTime(callback: (time: string) => void): Unsubscribe
  onMenuPreferences(callback: () => void): Unsubscribe
  onMenuToggleInspector(callback: () => void): Unsubscribe
  onDropFromDialog(callback: (files: DroppedFile[]) => void): Unsubscribe
  onUpdateStatus(callback: (status: UpdateStatus) => void): Unsubscribe
}
