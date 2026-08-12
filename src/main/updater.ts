import { app, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC_CHANNELS, type UpdateStatus } from '../shared/ipc'
import {
  canDownloadUpdate,
  canInstallUpdate,
  isManagedUpdateSupported
} from './updater-policy'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

let window: BrowserWindow | undefined
let status: UpdateStatus = { state: 'idle' }
let initialized = false

const supported = () =>
  isManagedUpdateSupported(app.isPackaged, process.platform)

const updateStatus = (nextStatus: UpdateStatus) => {
  status = nextStatus
  if (window && !window.isDestroyed()) {
    window.webContents.send(IPC_CHANNELS.updateStatus, status)
  }
}

const errorMessage = (error: Error) =>
  error.message || 'Unable to complete the update request'

const handleError = (error: Error) => {
  updateStatus({ state: 'error', message: errorMessage(error) })
}

export const initializeUpdater = (mainWindow: BrowserWindow) => {
  window = mainWindow
  if (!supported() || initialized) return

  initialized = true
  autoUpdater.autoDownload = false

  autoUpdater.on('checking-for-update', () => {
    updateStatus({ state: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    updateStatus({ state: 'available', version: info.version })
  })
  autoUpdater.on('update-not-available', (info) => {
    updateStatus({ state: 'not-available', version: info.version })
  })
  autoUpdater.on('download-progress', (progress) => {
    updateStatus({
      state: 'downloading',
      percent: Math.min(100, Math.max(0, Math.round(progress.percent)))
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    updateStatus({ state: 'downloaded', version: info.version })
  })
  autoUpdater.on('error', handleError)

  const timer = setInterval(() => {
    void checkForUpdates()
  }, CHECK_INTERVAL_MS)
  timer.unref()
}

export const getUpdateStatus = () => status

export const checkForUpdates = async () => {
  if (!supported()) return
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error)))
  }
}

export const downloadUpdate = async () => {
  if (!supported() || !canDownloadUpdate(status.state)) return
  updateStatus({ state: 'downloading', percent: 0 })
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error)))
  }
}

export const installUpdate = () => {
  if (!supported() || !canInstallUpdate(status.state)) return
  autoUpdater.quitAndInstall()
}
