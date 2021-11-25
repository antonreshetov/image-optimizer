const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const store = require('./store')
const { ImageOptimizer } = require('./image-compressor')
const menu = require('./menu')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 550,
    height: 370,
    ...store.app.get('bounds'),
    titleBarStyle: 'hidden',
    resizable: false,
    backgroundColor: '#212123',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2]
    mainWindow.loadURL(`http://localhost:${rendererPort}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.resolve(app.getAppPath(), 'renderer/index.html'))
  }

  mainWindow.on('close', e => {
    store.app.set('bounds', mainWindow.getBounds())
  })

  return { mainWindow }
}

app.whenReady().then(() => {
  createWindow()
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu(mainWindow)))

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('drop', (event, files = []) => {
  const optimizer = new ImageOptimizer(files, mainWindow)
  optimizer.start()
})
