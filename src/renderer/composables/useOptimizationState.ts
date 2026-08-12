import { reactive, readonly } from 'vue'
import type {
  FileFailure,
  FileOutput,
  OptimizationInput
} from '../../shared/ipc'
import type { OptimizationState } from '@/types'

const state = reactive<OptimizationState>({
  files: [],
  totalFiles: { originalSize: 0, compressedSize: 0 },
  showFileList: false,
  jobTime: '—',
  isOptimizing: false,
  selectedPath: null,
  inspectorVisible: true
})

const optimizationState = readonly(state)

const updateTotals = () => {
  state.totalFiles.originalSize = state.files.reduce(
    (total, file) => total + file.originalSize.bytes,
    0
  )
  state.totalFiles.compressedSize = state.files.reduce(
    (total, file) => total + (file.output?.compressedSize.bytes ?? 0),
    0
  )
}

const setFileListVisible = (visible: boolean) => {
  state.showFileList = visible
}

const addPendingFiles = (
  files: OptimizationInput[],
  clearCompleted = false
) => {
  if (clearCompleted) {
    state.files = state.files.filter(
      (file) => file.status === 'pending' || file.status === 'running'
    )
    if (!state.files.some((file) => file.path === state.selectedPath)) {
      state.selectedPath = state.files[0]?.path ?? null
    }
  }
  const existing = new Set(state.files.map((file) => file.path))
  for (const file of files) {
    if (!existing.has(file.path)) {
      state.files.push({ ...file, status: 'pending' })
      existing.add(file.path)
    }
  }
  state.selectedPath ??= state.files[0]?.path ?? null
  state.showFileList = state.files.length > 0
  updateTotals()
}

const addCompletedFile = (output: FileOutput) => {
  const file = state.files.find((item) => item.path === output.path)
  if (file) {
    file.status = 'completed'
    file.output = output
    file.error = undefined
  } else {
    state.files.push({
      name: output.name,
      path: output.path,
      type: '',
      originalSize: output.originalSize,
      status: 'completed',
      output
    })
  }
  state.selectedPath ??= output.path
  updateTotals()
}

const failFile = (failure: FileFailure) => {
  const file = state.files.find((item) => item.path === failure.path)
  if (!file) return
  file.status = 'failed'
  file.error = failure.message
}

const startOptimization = () => {
  for (const file of state.files) {
    if (file.status === 'pending') file.status = 'running'
  }
  state.jobTime = '—'
  state.isOptimizing = true
}

const finishOptimization = () => {
  for (const file of state.files) {
    if (file.status === 'running') {
      file.status = 'failed'
      file.error = 'Optimization did not finish'
    }
  }
  state.isOptimizing = false
}

const clearResults = () => {
  state.files = []
  state.selectedPath = null
  state.jobTime = '—'
  state.showFileList = false
  updateTotals()
}

const removeFile = (path: string) => {
  state.files = state.files.filter((item) => item.path !== path)
  if (state.selectedPath === path)
    state.selectedPath = state.files[0]?.path ?? null
  state.showFileList = state.files.length > 0
  updateTotals()
}

const selectFile = (path: string) => {
  state.selectedPath = path
}

const setJobTime = (time: string) => {
  state.jobTime = time
}

const toggleInspector = () => {
  state.inspectorVisible = !state.inspectorVisible
}

export const useOptimizationState = () => ({
  state: optimizationState,
  setFileListVisible,
  addPendingFiles,
  addCompletedFile,
  failFile,
  startOptimization,
  finishOptimization,
  clearResults,
  removeFile,
  selectFile,
  setJobTime,
  toggleInspector
})
