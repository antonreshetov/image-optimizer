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
  convertToWebp: boolean
}
