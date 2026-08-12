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
  pngQuality: number
  convertToWebp: boolean
  stripMetadata: boolean
  outputDirectoryName: string
}
