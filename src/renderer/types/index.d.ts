import type { FileOutput } from '../../shared/ipc'

export interface OptimizationState {
  files: FileOutput[]
  totalFiles: {
    originalSize: number
    compressedSize: number
  }
  jobTime: string
  showFileList: boolean
}
