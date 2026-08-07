import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import path from 'path'
import { pathToFileURL } from 'node:url'
import { store } from './store'
import { ImageOptimizer } from './image-compressor'
import { createMenu } from './menu'
import { IPC_CHANNELS, type AppSettings } from '../shared/ipc'
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateStatus,
  initializeUpdater,
  installUpdate
} from './updater'
import {
  isAllowedExternalUrl,
  isValidDroppedFiles,
  isValidSettingUpdate
} from './ipc-validation'

const isDev = !app.isPackaged
const rendererDevUrl = 'http://127.0.0.1:3000'
const rendererFile = path.resolve(app.getAppPath(), 'build/renderer/index.html')
let mainWindow: BrowserWindow

const isAllowedRendererUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (isDev) return url.origin === rendererDevUrl

    return value.split('#', 1)[0] === pathToFileURL(rendererFile).href
  } catch {
    return false
  }
}

function createWindow() {
  const bounds = store.app.get('bounds')
  mainWindow = new BrowserWindow({
    width: 550,
    height: 370,
    ...bounds,
    titleBarStyle: 'hidden',
    resizable: false,
    backgroundColor: '#212123',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  if (isDev) {
    mainWindow.loadURL(rendererDevUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(rendererFile)
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedRendererUrl(url)) event.preventDefault()
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.on('close', () => {
    store.app.set('bounds', mainWindow.getBounds())
  })

  return { mainWindow }
}

function init() {
  createWindow()
  initializeUpdater(mainWindow)
  mainWindow.webContents.once('did-finish-load', () => {
    void checkForUpdates()
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenu(mainWindow)))
}

app.whenReady().then(async () => {
  if (isDev) {
    const { default: installExtension, VUEJS_DEVTOOLS } =
      await import('electron-devtools-installer')
    installExtension(VUEJS_DEVTOOLS)
  }

  init()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      init()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

const isTrustedSender = (
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
) =>
  event.sender === mainWindow?.webContents &&
  event.senderFrame === mainWindow.webContents.mainFrame &&
  isAllowedRendererUrl(event.senderFrame.url)

const getSettingsSnapshot = (): AppSettings => ({
  addToSubfolder: store.app.get('addToSubfolder'),
  addMinSuffix: store.app.get('addMinSuffix'),
  clearResultList: store.app.get('clearResultList'),
  animationOnCompletion: store.app.get('animationOnCompletion'),
  mozjpeg: store.app.get('mozjpeg'),
  pngquant: store.app.get('pngquant'),
  convertToWebp: store.app.get('convertToWebp')
})

ipcMain.on(IPC_CHANNELS.optimizeFiles, (event, files: unknown) => {
  if (!isTrustedSender(event) || !isValidDroppedFiles(files)) return
  const optimizer = new ImageOptimizer(files, mainWindow)
  optimizer.start()
})

ipcMain.handle(IPC_CHANNELS.getSettings, (event) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  return getSettingsSnapshot()
})

ipcMain.handle(IPC_CHANNELS.updateSetting, (event, update: unknown) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  if (!isValidSettingUpdate(update))
    throw new TypeError('Invalid setting update')
  store.app.set(update.key, update.value)
})

ipcMain.handle(IPC_CHANNELS.openExternal, async (event, url: unknown) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  if (!isAllowedExternalUrl(url))
    throw new TypeError('External URL is not allowed')
  await shell.openExternal(url)
})

ipcMain.handle(IPC_CHANNELS.getUpdateStatus, (event) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  return getUpdateStatus()
})

ipcMain.handle(IPC_CHANNELS.checkForUpdates, async (event) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  await checkForUpdates()
})

ipcMain.handle(IPC_CHANNELS.downloadUpdate, async (event) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  await downloadUpdate()
})

ipcMain.handle(IPC_CHANNELS.installUpdate, (event) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender')
  installUpdate()
})
