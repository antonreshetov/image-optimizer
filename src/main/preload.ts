import type { EventCallback } from './types'
import { contextBridge, ipcRenderer } from 'electron'
import { store } from '../main/store'

contextBridge.exposeInMainWorld('electron', {
  ipc: {
    on: (channel: string, cb: EventCallback) => ipcRenderer.on(channel, cb),
    send: (channel: string, data: any, cb?: EventCallback) => {
      ipcRenderer.send(channel, data)
      if (cb && typeof cb === 'function') {
        ipcRenderer.on(channel, cb)
      }
    },
    removeListener: (channel: string, cb: EventCallback) =>
      ipcRenderer.removeListener(channel, cb),
    removeListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel)
  },
  store: {
    set: (key: any, value: any) => store.app.set(key, value),
    get: (key: any) => store.app.get(key),
    on: (key: any, cb: any) => store.app.onDidChange(key, cb)
  }
})
