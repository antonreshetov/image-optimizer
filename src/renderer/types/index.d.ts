import type { FileOutput, StoreSchema } from '../../main/types'

export interface DroppedFile {
  name: string
  path: string
  type: string
}

export interface AppState {
  files: FileOutput[]
  totalFiles: {
    originalSize: number
    compressedSize: number
  }
  jobTime: string
  showFileList: boolean
  settings: Pick<
  StoreSchema,
  | 'mozjpeg'
  | 'pngquant'
  | 'addMinSuffix'
  | 'convertPngToWebp'
  | 'clearResultList'
  | 'addToSubfolder'
  | 'animationOnCompletion'
  >
}
