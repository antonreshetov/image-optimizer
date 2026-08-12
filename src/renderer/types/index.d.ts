import type { FileOutput, OptimizationInput } from '../../shared/ipc'

export interface OptimizationItem extends OptimizationInput {
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: FileOutput
  error?: string
}

export interface OptimizationState {
  files: OptimizationItem[]
  totalFiles: {
    originalSize: number
    compressedSize: number
  }
  jobTime: string
  showFileList: boolean
  isOptimizing: boolean
  selectedPath: string | null
  inspectorVisible: boolean
}
