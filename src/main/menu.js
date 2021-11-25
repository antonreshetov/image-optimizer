const { app, dialog, BrowserWindow, shell } = require('electron')
const { version, author } = require('../../package.json')
const os = require('os')

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

function createImageOptimizerMenu (context) {
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
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
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
}

module.exports = context => {
  const imageOptimizer = {
    label: 'Image Optimizer',
    submenu: createImageOptimizerMenu(context)
  }

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
        label: 'About',
        click () {
          dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
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

              ©2019-${year} Anton Reshetov <reshetov-art@gmail.com>
            `
          })
        }
      }
    ]
  }

  return [imageOptimizer, help]
}
