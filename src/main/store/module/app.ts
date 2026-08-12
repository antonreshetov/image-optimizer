import Store from 'electron-store'
import type { StoreSchema } from '../../types'
import { DEFAULT_PNG_QUALITY, resolvePngQuality } from '../../png-quality'

interface LegacyStoreSchema {
  pngquant?: {
    qualityMax?: number
  }
}

const appStore = new Store<StoreSchema>({
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
    pngQuality: {
      type: 'number',
      minimum: 0,
      maximum: 100
    },
    convertToWebp: {
      type: 'boolean',
      default: false
    },
    stripMetadata: {
      type: 'boolean',
      default: true
    },
    outputDirectoryName: {
      type: 'string',
      minLength: 1,
      maxLength: 80,
      default: 'minified'
    }
  }
})

if (!appStore.has('pngQuality')) {
  const legacyStore = appStore.store as StoreSchema & LegacyStoreSchema
  appStore.set(
    'pngQuality',
    resolvePngQuality(
      undefined,
      legacyStore.pngquant?.qualityMax ?? DEFAULT_PNG_QUALITY
    )
  )
}

export default appStore
