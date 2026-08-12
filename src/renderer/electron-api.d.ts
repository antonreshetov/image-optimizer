import type { ElectronApi } from '../shared/ipc'

declare global {
  interface Window {
    electron: ElectronApi
  }
}

export {}
