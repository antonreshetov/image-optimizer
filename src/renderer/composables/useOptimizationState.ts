import { reactive, readonly } from 'vue'
import type { FileOutput } from '../../shared/ipc'
import type { OptimizationState } from '@/types'

const state = reactive<OptimizationState>({
  files: [],
  totalFiles: {
    originalSize: 0,
    compressedSize: 0
  },
  showFileList: false,
  jobTime: '-'
})

const optimizationState = readonly(state)

const setFileListVisible = (visible: boolean) => {
  state.showFileList = visible
}

const addCompletedFile = (file: FileOutput) => {
  state.files.push(file)
  state.totalFiles.originalSize += file.originalSize.bytes
  state.totalFiles.compressedSize += file.compressedSize.bytes
}

const startOptimization = (clearResultList: boolean) => {
  if (clearResultList) {
    state.files = []
    state.totalFiles.originalSize = 0
    state.totalFiles.compressedSize = 0
  }
  state.jobTime = '-'
}

const setJobTime = (time: string) => {
  state.jobTime = time
}

export const useOptimizationState = () => ({
  state: optimizationState,
  setFileListVisible,
  addCompletedFile,
  startOptimization,
  setJobTime
})
