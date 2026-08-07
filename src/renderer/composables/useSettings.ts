import { reactive, readonly } from 'vue'
import { electron } from '@/electron'
import type { AppSettings, SettingUpdate } from '../../shared/ipc'

const settings = reactive<AppSettings>({
  mozjpeg: { quality: 75 },
  pngquant: { qualityMax: 85, qualityMin: 75 },
  convertToWebp: false,
  addMinSuffix: false,
  addToSubfolder: true,
  clearResultList: false,
  animationOnCompletion: true
})

const readonlySettings = readonly(settings)

const settingsReady = electron.getSettings().then((snapshot) => {
  Object.assign(settings, snapshot)
})

const persist = async (update: SettingUpdate) => {
  try {
    await electron.updateSetting(update)
  } catch (error) {
    Object.assign(settings, await electron.getSettings())
    console.error('Unable to persist setting', error)
  }
}

const getQualityNumber = (min: number, max: number, value: number) =>
  Math.round(Math.min(max, Math.max(min, value)))

const setJpegQuality = (quality: number) => {
  const value = getQualityNumber(0, 100, Number(quality))
  settings.mozjpeg.quality = value
  persist({ key: 'mozjpeg.quality', value })
}

const setPngQualityMin = (quality: number) => {
  const value = getQualityNumber(0, 99, Number(quality))
  settings.pngquant.qualityMin = value
  if (settings.pngquant.qualityMin < settings.pngquant.qualityMax) {
    persist({ key: 'pngquant.qualityMin', value })
  }
}

const setPngQualityMax = (quality: number) => {
  const value = getQualityNumber(0, 100, Number(quality))
  settings.pngquant.qualityMax = value
  if (settings.pngquant.qualityMin < settings.pngquant.qualityMax) {
    persist({ key: 'pngquant.qualityMax', value })
  }
}

const setConvertToWebp = (value: boolean) => {
  settings.convertToWebp = value
  persist({ key: 'convertToWebp', value })
}

const setAddMinSuffix = (value: boolean) => {
  settings.addMinSuffix = value
  persist({ key: 'addMinSuffix', value })
}

const setAddToSubfolder = (value: boolean) => {
  settings.addToSubfolder = value
  persist({ key: 'addToSubfolder', value })
}

const setClearResultList = (value: boolean) => {
  settings.clearResultList = value
  persist({ key: 'clearResultList', value })
}

const setAnimationOnCompletion = (value: boolean) => {
  settings.animationOnCompletion = value
  persist({ key: 'animationOnCompletion', value })
}

export const useSettings = () => ({
  settings: readonlySettings,
  settingsReady,
  setJpegQuality,
  setPngQualityMin,
  setPngQualityMax,
  setConvertToWebp,
  setAddMinSuffix,
  setAddToSubfolder,
  setClearResultList,
  setAnimationOnCompletion
})
