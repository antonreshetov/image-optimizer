import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  shell
} from 'electron'
import path from 'path'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import mime from 'mime-types'
import { store } from './store'
import { ImageOptimizer } from './image-compressor'
import { createMenu } from './menu'
import {
  IPC_CHANNELS,
  type AppSettings,
  type ComparisonPayload
} from '../shared/ipc'
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
import { isPreviewPathAllowed } from './preview-access'
import {
  expandDroppedFiles,
  getFilesOrDirs,
  getFileSize,
  getSafeOutputDirectoryName
} from './utils'
import { allowPreviewPaths } from './preview-access'

const isDev = !app.isPackaged
const rendererDevUrl = 'http://127.0.0.1:3000'
const rendererFile = path.resolve(app.getAppPath(), 'build/renderer/index.html')
let mainWindow: BrowserWindow
const appWindows = new Set<BrowserWindow>()
const comparisonPayloads = new Map<number, ComparisonPayload>()
const previewWaiters: Array<() => void> = []
let activePreviewRequests = 0

const withPreviewSlot = async <T>(work: () => Promise<T>): Promise<T> => {
  if (activePreviewRequests >= 4) {
    await new Promise<void>((resolve) => previewWaiters.push(resolve))
  }
  activePreviewRequests += 1
  try {
    return await work()
  } finally {
    activePreviewRequests -= 1
    previewWaiters.shift()?.()
  }
}

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
  const storedBounds = store.app.get('bounds') as Partial<Electron.Rectangle>
  const bounds = {
    ...storedBounds,
    width: Math.max(1040, storedBounds.width ?? 1080),
    height: Math.max(620, storedBounds.height ?? 700)
  }
  mainWindow = new BrowserWindow({
    minWidth: 1040,
    minHeight: 620,
    ...bounds,
    titleBarStyle: 'hidden',
    resizable: true,
    show: false,
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  appWindows.add(mainWindow)

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow.isDestroyed()) mainWindow.show()
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
    appWindows.delete(mainWindow)
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

const getTrustedWindow = (
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  return window &&
    appWindows.has(window) &&
    event.senderFrame === window.webContents.mainFrame &&
    isAllowedRendererUrl(event.senderFrame.url)
    ? window
    : null
}

const isTrustedMainSender = (
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
) => getTrustedWindow(event) === mainWindow

const getSettingsSnapshot = (): AppSettings => ({
  addToSubfolder: store.app.get('addToSubfolder'),
  addMinSuffix: store.app.get('addMinSuffix'),
  clearResultList: store.app.get('clearResultList'),
  animationOnCompletion: store.app.get('animationOnCompletion'),
  mozjpeg: store.app.get('mozjpeg'),
  pngQuality: store.app.get('pngQuality'),
  convertToWebp: store.app.get('convertToWebp'),
  stripMetadata: store.app.get('stripMetadata'),
  outputDirectoryName: store.app.get('outputDirectoryName')
})

ipcMain.on(IPC_CHANNELS.optimizeFiles, (event, files: unknown) => {
  if (!isTrustedMainSender(event) || !isValidDroppedFiles(files)) return
  const optimizer = new ImageOptimizer(files, mainWindow)
  optimizer.start()
})

ipcMain.handle(IPC_CHANNELS.getSettings, (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  return getSettingsSnapshot()
})

ipcMain.handle(IPC_CHANNELS.updateSetting, (event, update: unknown) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  if (!isValidSettingUpdate(update))
    throw new TypeError('Invalid setting update')
  store.app.set(update.key, update.value)
})

ipcMain.handle(IPC_CHANNELS.openExternal, async (event, url: unknown) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  if (!isAllowedExternalUrl(url))
    throw new TypeError('External URL is not allowed')
  await shell.openExternal(url)
})

ipcMain.handle(IPC_CHANNELS.getUpdateStatus, (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  return getUpdateStatus()
})

ipcMain.handle(IPC_CHANNELS.checkForUpdates, async (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  await checkForUpdates()
})

ipcMain.handle(IPC_CHANNELS.downloadUpdate, async (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  await downloadUpdate()
})

ipcMain.handle(IPC_CHANNELS.installUpdate, (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  installUpdate()
})

ipcMain.handle(
  IPC_CHANNELS.getImagePreview,
  async (event, filePath: unknown) => {
    const window = getTrustedWindow(event)
    if (!window) throw new Error('Untrusted IPC sender')
    const comparisonPayload = comparisonPayloads.get(window.id)
    const isComparisonPath =
      comparisonPayload &&
      (comparisonPayload.path === filePath ||
        comparisonPayload.outputPath === filePath)
    if (
      typeof filePath !== 'string' ||
      (window === mainWindow
        ? !isPreviewPathAllowed(filePath)
        : !isComparisonPath)
    ) {
      throw new TypeError('Preview path is not allowed')
    }

    return withPreviewSlot(async () => {
      if (getFileSize(filePath).bytes > 32 * 1024 * 1024) {
        throw new Error('Image preview is too large')
      }

      const image = nativeImage.createFromPath(filePath)
      if (image.isEmpty()) {
        const mediaType = mime.lookup(filePath)
        if (
          typeof mediaType !== 'string' ||
          ![
            'image/gif',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp'
          ].includes(mediaType)
        ) {
          throw new Error('Image preview is unavailable')
        }
        const data = await readFile(filePath)
        return `data:${mediaType};base64,${data.toString('base64')}`
      }

      const size = image.getSize()
      const scale = Math.min(1, 2_048 / Math.max(size.width, size.height))
      const preview =
        scale < 1
          ? image.resize({
              width: Math.max(1, Math.round(size.width * scale)),
              height: Math.max(1, Math.round(size.height * scale)),
              quality: 'best'
            })
          : image
      return preview.toDataURL()
    })
  }
)

ipcMain.handle(IPC_CHANNELS.revealOutput, (event, filePath: unknown) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  if (typeof filePath !== 'string' || !isPreviewPathAllowed(filePath)) {
    throw new TypeError('Output path is not allowed')
  }
  shell.showItemInFolder(filePath)
})

ipcMain.handle(
  IPC_CHANNELS.showFileContextMenu,
  (event, removeEnabled: unknown) => {
    const window = getTrustedWindow(event)
    if (window !== mainWindow || typeof removeEnabled !== 'boolean') {
      throw new TypeError('Invalid file context menu request')
    }

    return new Promise<'remove' | null>((resolve) => {
      let action: 'remove' | null = null
      const menu = Menu.buildFromTemplate([
        {
          label: 'Remove',
          enabled: removeEnabled,
          click: () => {
            action = 'remove'
          }
        }
      ])
      menu.popup({
        window,
        callback: () => resolve(action)
      })
    })
  }
)

ipcMain.handle(IPC_CHANNELS.chooseFiles, async (event) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] }
    ]
  })
  return getFilesOrDirs(filePaths)
})

ipcMain.handle(IPC_CHANNELS.prepareFiles, (event, files: unknown) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  if (!isValidDroppedFiles(files)) throw new TypeError('Invalid image files')
  const inputs = expandDroppedFiles(
    files,
    getSafeOutputDirectoryName(store.app.get('outputDirectoryName')),
    store.app.get('addToSubfolder')
  )
  allowPreviewPaths(...inputs.map((input) => input.path))
  return inputs
})

ipcMain.handle(IPC_CHANNELS.openComparison, async (event, request: unknown) => {
  if (!isTrustedMainSender(event)) throw new Error('Untrusted IPC sender')
  if (!request || typeof request !== 'object')
    throw new TypeError('Invalid comparison')
  const candidate = request as Record<string, unknown>
  if (
    typeof candidate.path !== 'string' ||
    typeof candidate.outputPath !== 'string' ||
    !isPreviewPathAllowed(candidate.path) ||
    !isPreviewPathAllowed(candidate.outputPath)
  ) {
    throw new TypeError('Comparison paths are not allowed')
  }

  const comparisonWidth = 1240
  const comparisonHeight = 760
  const sourceBounds = mainWindow.getBounds()
  const workArea = screen.getDisplayMatching(sourceBounds).workArea
  const centeredX = Math.round(
    sourceBounds.x + (sourceBounds.width - comparisonWidth) / 2
  )
  const centeredY = Math.round(
    sourceBounds.y + (sourceBounds.height - comparisonHeight) / 2
  )
  const x = Math.min(
    Math.max(centeredX, workArea.x),
    workArea.x + Math.max(0, workArea.width - comparisonWidth)
  )
  const y = Math.min(
    Math.max(centeredY, workArea.y),
    workArea.y + Math.max(0, workArea.height - comparisonHeight)
  )

  const comparisonWindow = new BrowserWindow({
    width: comparisonWidth,
    height: comparisonHeight,
    x,
    y,
    minWidth: 860,
    minHeight: 560,
    title: 'Comparison',
    titleBarStyle: 'hidden',
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  appWindows.add(comparisonWindow)
  comparisonPayloads.set(comparisonWindow.id, {
    name: path.basename(candidate.path),
    path: candidate.path,
    outputPath: candidate.outputPath,
    originalSize: getFileSize(candidate.path),
    compressedSize: getFileSize(candidate.outputPath)
  })
  comparisonWindow.on('closed', () => {
    comparisonPayloads.delete(comparisonWindow.id)
    appWindows.delete(comparisonWindow)
  })
  comparisonWindow.webContents.on('will-navigate', (navigationEvent, url) => {
    if (!isAllowedRendererUrl(url)) navigationEvent.preventDefault()
  })
  comparisonWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  const route = '/comparison'
  if (isDev) await comparisonWindow.loadURL(`${rendererDevUrl}/#${route}`)
  else await comparisonWindow.loadFile(rendererFile, { hash: route })
})

ipcMain.handle(IPC_CHANNELS.getComparisonPayload, (event) => {
  const window = getTrustedWindow(event)
  const payload = window && comparisonPayloads.get(window.id)
  if (!payload) throw new Error('Comparison is unavailable')
  return payload
})
