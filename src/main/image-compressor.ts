import { allowPreviewPaths } from './preview-access'
import { store } from '../main/store'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS, type DroppedFile } from '../shared/ipc'
import { optimizeImages, type OptimizerOptions } from './optimizer'

const getOptionsFromStore = (): OptimizerOptions => ({
  concurrency: store.app.get('concurrency'),
  outputDirectoryName: store.app.get('outputDirectoryName'),
  addToSubfolder: store.app.get('addToSubfolder'),
  addMinSuffix: store.app.get('addMinSuffix'),
  convertToWebp: store.app.get('convertToWebp'),
  stripMetadata: store.app.get('stripMetadata'),
  jpegQuality: store.app.get('mozjpeg').quality,
  pngQuality: store.app.get('pngQuality')
})

export class ImageOptimizer {
  #context
  files: DroppedFile[]

  constructor(files: DroppedFile[] = [], context: BrowserWindow) {
    this.#context = context

    this.files = files
  }

  start() {
    const timeStart = new Date()

    this.#context.webContents.send(IPC_CHANNELS.optimizationStart)
    void optimizeImages(this.files, getOptionsFromStore(), {
      onFileComplete: (output) => {
        allowPreviewPaths(output.path, output.outputPath)
        this.#context.webContents.send(IPC_CHANNELS.fileComplete, output)
      },
      onFileFailed: (failure, error) => {
        console.error(error)
        this.#context.webContents.send(IPC_CHANNELS.fileFailed, failure)
      }
    })
      .catch((error) => console.error(error))
      .finally(() => this.#finish(timeStart))
  }

  #finish(timeStart: Date) {
    const timeEnd = new Date()
    const timeSpent = `${(timeEnd.valueOf() - timeStart.valueOf()) / 1000}s`

    this.#context.webContents.send(IPC_CHANNELS.optimizationComplete)
    this.#context.webContents.send(IPC_CHANNELS.jobTime, timeSpent)
  }
}
