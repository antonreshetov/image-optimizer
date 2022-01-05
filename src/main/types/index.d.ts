import type { IpcRendererEvent } from 'electron'

declare interface EventCallback {
  (event?: IpcRendererEvent, ...args: any[]): void
}

declare global {
  interface Window {
    electron: {
      ipc: {
        on: (channel: string, cb: EventCallback) => void
        send: (channel: string, data: any, cb?: EventCallback) => void
        removeListener: (channel: string, cb: EventCallback) => void
        removeListeners: (channel: string) => void
      }
      store: {
        set: (key: any, value: any) => void
        get: (key: any) => any
        on: (key: any, cb: any) => void
      }
    }
  }
}

export interface StoreSchema {
  bounds: object
  addToSubfolder: boolean
  addMinSuffix: boolean
  clearResultList: boolean
  animationOnCompletion: boolean
  concurrency: number
  mozjpeg: {
    quality: number
  }
  pngquant: {
    qualityMin: number
    qualityMax: number
  }
}

export interface FileSize {
  bytes: number
  readable: string
}

export interface FileOutput {
  name: string
  path: string
  originalSize: FileSize
  compressedSize: FileSize
  compressionPercentage: number
}
