import Store from 'electron-store'
import type { StoreSchema } from '../../types'

export default new Store<StoreSchema>({
  name: 'app',
  watch: true,

  schema: {
    bounds: {
      type: 'object',
      default: {}
    },
    addToSubfolder: {
      type: 'boolean',
      default: true
    },
    addMinSuffix: {
      type: 'boolean',
      default: false
    },
    clearResultList: {
      type: 'boolean',
      default: false
    },
    animationOnCompletion: {
      type: 'boolean',
      default: true
    },
    concurrency: {
      type: 'number',
      default: 10
    },
    mozjpeg: {
      type: 'object',
      properties: {
        quality: {
          type: 'number',
          default: 75
        }
      },
      default: {}
    },
    pngquant: {
      type: 'object',
      properties: {
        qualityMin: {
          type: 'number',
          default: 75
        },
        qualityMax: {
          type: 'number',
          default: 85
        }
      },
      default: {}
    }
  }
})
