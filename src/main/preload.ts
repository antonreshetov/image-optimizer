import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AppPlatform,
  ElectronApi,
  DroppedFile,
  FileFailure,
  FileOutput,
  IPC_CHANNELS as IpcChannels,
  UpdateStatus
} from '../shared/ipc'

// Песочница preload не может подключать локальные модули. Эта типизированная
// копия оставляет собранный preload самодостаточным.
const IPC_CHANNELS: typeof IpcChannels = {
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
}

const subscribe = <T>(channel: string, callback: (payload: T) => void) => {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => {
    callback(payload)
  }
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const subscribeWithoutPayload = (channel: string, callback: () => void) => {
  const listener = () => callback()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const platform: AppPlatform = ['darwin', 'win32', 'linux'].includes(
  process.platform
)
  ? (process.platform as AppPlatform)
  : 'other'

const api: ElectronApi = {
  platform,
  getPathForFile: (file) => webUtils.getPathForFile(file),
  optimizeFiles: (files) => ipcRenderer.send(IPC_CHANNELS.optimizeFiles, files),
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.getSettings),
  updateSetting: (update) =>
    ipcRenderer.invoke(IPC_CHANNELS.updateSetting, update),
  openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.openExternal, url),
  getUpdateStatus: () => ipcRenderer.invoke(IPC_CHANNELS.getUpdateStatus),
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.checkForUpdates),
  downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.downloadUpdate),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.installUpdate),
  getImagePreview: (path) =>
    ipcRenderer.invoke(IPC_CHANNELS.getImagePreview, path),
  revealOutput: (path) => ipcRenderer.invoke(IPC_CHANNELS.revealOutput, path),
  chooseFiles: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFiles),
  prepareFiles: (files) => ipcRenderer.invoke(IPC_CHANNELS.prepareFiles, files),
  showFileContextMenu: (removeEnabled) =>
    ipcRenderer.invoke(IPC_CHANNELS.showFileContextMenu, removeEnabled),
  openComparison: (file) =>
    ipcRenderer.invoke(IPC_CHANNELS.openComparison, file),
  getComparisonPayload: () =>
    ipcRenderer.invoke(IPC_CHANNELS.getComparisonPayload),
  onFileComplete: (callback) =>
    subscribe<FileOutput>(IPC_CHANNELS.fileComplete, callback),
  onFileFailed: (callback) =>
    subscribe<FileFailure>(IPC_CHANNELS.fileFailed, callback),
  onOptimizationStart: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.optimizationStart, callback),
  onOptimizationComplete: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.optimizationComplete, callback),
  onJobTime: (callback) => subscribe<string>(IPC_CHANNELS.jobTime, callback),
  onMenuPreferences: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.menuPreferences, callback),
  onMenuToggleInspector: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.menuToggleInspector, callback),
  onDropFromDialog: (callback) =>
    subscribe<DroppedFile[]>(IPC_CHANNELS.dropFromDialog, callback),
  onUpdateStatus: (callback) =>
    subscribe<UpdateStatus>(IPC_CHANNELS.updateStatus, callback)
}

contextBridge.exposeInMainWorld('electron', api)
