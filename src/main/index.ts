import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import path from 'path'
import { store } from './store'
import { checkForUpdate } from './update-check'
import { ImageOptimizer } from './image-compressor'
import { createMenu } from './menu'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow

function createWindow () {
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
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  if (isDev) {
    const rendererPort = process.argv[2]
    mainWindow.loadURL(`http://localhost:${rendererPort}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(
      path.resolve(app.getAppPath(), 'src/renderer/index.html')
    )
  }

  mainWindow.on('close', () => {
    store.app.set('bounds', mainWindow.getBounds())
  })

  return { mainWindow }
}

function init () {
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

ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url)
})
