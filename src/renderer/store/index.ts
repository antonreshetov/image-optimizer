import { defineStore } from 'pinia'
import { store as electronStore } from '@/electron'
import type { AppState } from '@/types'

export const useStore = defineStore('app', {
  state: () =>
    ({
      files: [],
      totalFiles: {
        originalSize: 0,
        compressedSize: 0
      },
      showFileList: false,
      jobTime: '-',
      settings: {
        mozjpeg: {
          quality: electronStore.get('mozjpeg.quality')
        },
        pngquant: {
          qualityMax: electronStore.get('pngquant.qualityMax'),
          qualityMin: electronStore.get('pngquant.qualityMin')
        },
        convertToWebp: electronStore.get('convertToWebp'),
        addMinSuffix: electronStore.get('addMinSuffix'),
        addToSubfolder: electronStore.get('addToSubfolder'),
        clearResultList: electronStore.get('clearResultList'),
        animationOnCompletion: electronStore.get('animationOnCompletion')
      }
    } as AppState)
})
