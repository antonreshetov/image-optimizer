const { contextBridge, ipcRenderer } = require('electron')
const store = require('../main/store')

contextBridge.exposeInMainWorld('electron', {
  ipc: {
    on: (channel, cb) => ipcRenderer.on(channel, cb),
    send: (channel, data, cb) => {
      ipcRenderer.send(channel, data)
      if (cb && typeof cb === 'function') {
        ipcRenderer.on(channel, cb)
      }
    },
    removeListener: (channel, cb) => ipcRenderer.removeListener(channel, cb),
    removeListeners: channel => ipcRenderer.removeAllListeners(channel)
  },
  store: {
    set: (key, value) => store.app.set(key, value),
    get: key => store.app.get(key),
    on: (key, cb) => store.app.onDidChange(key, cb)
  }
})
