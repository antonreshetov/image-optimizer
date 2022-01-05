import type { MenuItemConstructorOptions } from 'electron'
import { app, dialog, shell, BrowserWindow } from 'electron'
import { version, author } from '../../package.json'
import os from 'os'
import { getFilesOrDirs } from './utils'
import { ImageOptimizer } from './image-compressor'

const isMac = process.platform === 'darwin'
const year = new Date().getFullYear()

if (isMac) {
  app.setAboutPanelOptions({
    applicationName: 'Image Optimizer',
    applicationVersion: version,
    version,
    copyright: `${author.name}\n ©2021-${year}`
  })
}

const createSubmenu = (context: BrowserWindow): MenuItemConstructorOptions[] => {
  if (isMac) {
    return [
      {
        label: 'About Image Optimizer',
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Preferences',
        accelerator: 'CommandOrControl+,',
        click () {
          context.webContents.send('menu:preferences')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide Image Optimizer',
        accelerator: 'Command+H'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H'
      },
      {
        label: 'Show All'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Image Optimizer',
        role: 'quit',
        accelerator: 'CommandOrControl+Q'
      }
    ]
  }
  return []
}

export const createMenu = (context: BrowserWindow): MenuItemConstructorOptions[] => {
  const imageOptimizer = {
    label: 'Image Optimizer',
    submenu: createSubmenu(context)
  }

  const file = {
    label: 'File',
    submenu: [
      {
        label: 'Open Images',
        async click () {
          const { filePaths } = await dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory', 'multiSelections']
          })
          console.log(filePaths)
          if (filePaths.length) {
            const files = getFilesOrDirs(filePaths)
            const optimizer = new ImageOptimizer(files, context)
            context.webContents.send('drop-from-dialog')
            optimizer.start()
          }
        },
        accelerator: 'CommandOrControl+O'
      }
    ]
  } as MenuItemConstructorOptions

  const help = {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'View in GitHub',
        click () {
          shell.openExternal('https://github.com/antonreshetov/image-optimizer')
        }
      },
      {
        label: 'Report Issue',
        click () {
          shell.openExternal(
            'https://github.com/antonreshetov/image-optimizer/issues/new'
          )
        }
      },
      {
        label: 'Donate',
        submenu: [
          {
            label: 'PayPal',
            click () {
              shell.openExternal('https://paypal.me/antonreshetov')
            }
          },
          {
            label: 'Patreon',
            click () {
              shell.openExternal('https://patreon.com/antonreshetov')
            }
          },
          {
            label: 'Ko-Fi',
            click () {
              shell.openExternal('https://ko-fi.com/antonreshetov')
            }
          }
        ]
      },
      {
        label: 'About',
        click () {
          dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
            title: 'Image Optimizer',
            message: 'Image Optimizer',
            type: 'info',
            detail: `
              Version: ${version}
              Electron: ${process.versions.electron}
              Chrome: ${process.versions.chrome}
              Node.js: ${process.versions.node}
              V8: ${process.versions.v8}
              OS: ${os.type()} ${os.arch()} ${os.release()}

              ©2021-${year} Anton Reshetov <reshetov.art@gmail.com>
            `
          })
        }
      },
      {
        label: 'Open Developer Tools',
        accelerator: 'Alt+CommandOrControl+I',
        click () {
          context.webContents.openDevTools({ mode: 'detach' })
        }
      }
    ]
  } as MenuItemConstructorOptions

  return [imageOptimizer, file, help]
}
