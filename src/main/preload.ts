import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  ElectronApi,
  FileOutput,
  IPC_CHANNELS as IpcChannels,
  UpdateStatus
} from '../shared/ipc'

// Sandboxed preload scripts cannot require local modules. This type-checked copy
// keeps the emitted preload self-contained while the main process owns the shared
// runtime constants.
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
  dropFromDialog: 'optimizer:drop-from-dialog',
  getUpdateStatus: 'updater:get-status',
  checkForUpdates: 'updater:check',
  downloadUpdate: 'updater:download',
  installUpdate: 'updater:install',
  updateStatus: 'updater:status'
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

const api: ElectronApi = {
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
  onFileComplete: (callback) =>
    subscribe<FileOutput>(IPC_CHANNELS.fileComplete, callback),
  onOptimizationStart: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.optimizationStart, callback),
  onOptimizationComplete: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.optimizationComplete, callback),
  onJobTime: (callback) => subscribe<string>(IPC_CHANNELS.jobTime, callback),
  onMenuPreferences: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.menuPreferences, callback),
  onDropFromDialog: (callback) =>
    subscribeWithoutPayload(IPC_CHANNELS.dropFromDialog, callback),
  onUpdateStatus: (callback) =>
    subscribe<UpdateStatus>(IPC_CHANNELS.updateStatus, callback)
}

contextBridge.exposeInMainWorld('electron', api)
