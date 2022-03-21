import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import type { Rectangle } from 'electron'
import path from 'path'
import { platform } from 'process'
import { store } from './store'
import { checkForUpdate } from './update-check'
import { ImageOptimizer } from './image-compressor'
import { createMenu } from './menu'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow

function getPlatform () {
  switch (platform) {
    case 'darwin': return 'macos'
    case 'win32': return 'windows'
    default: return 'linux'
  }
}

function createWindow () {
  const { x, y } = store.app.get('bounds') as Rectangle
  mainWindow = new BrowserWindow({
    width: 550,
    height: 370,
    x,
    y,
    titleBarStyle: 'hidden',
    resizable: false,
    backgroundColor: '#212123',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  if (isDev) {
    const rendererPort = process.argv[2]
    mainWindow.loadURL(`http://localhost:${rendererPort}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.resolve(app.getAppPath(), 'src/renderer/index.html'))
  }

  mainWindow.on('close', () => {
    store.app.set('bounds', mainWindow.getBounds())
  })

  return { mainWindow }
}

function init () {
  store.app.set('os', getPlatform())
  createWindow()
  checkForUpdate(mainWindow)
  Menu.setApplicationMenu(Menu.buildFromTemplate(createMenu(mainWindow)))
}

app.whenReady().then(async () => {
  if (isDev) {
    const { default: installExtension, VUEJS3_DEVTOOLS } = await import(
      'electron-devtools-installer'
    )
    installExtension(VUEJS3_DEVTOOLS)
  }

  init()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      init()
    }
    checkForUpdate(mainWindow)
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('drop', (_, files = []) => {
  const optimizer = new ImageOptimizer(files, mainWindow)
  optimizer.start()
})

ipcMain.on('toolbar', (_, type) => {
  switch (type) {
    case 'reduce': return mainWindow.minimize()
    case 'maximize': return mainWindow.maximize()
    case 'close': return mainWindow.close()
  }
})

ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url)
})
