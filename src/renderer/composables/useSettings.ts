import { reactive, readonly } from 'vue'
import { electron } from '@/electron'
import type { AppSettings, SettingUpdate } from '../../shared/ipc'

const settings = reactive<AppSettings>({
  mozjpeg: { quality: 75 },
  pngQuality: 75,
  convertToWebp: false,
  addMinSuffix: false,
  addToSubfolder: true,
  clearResultList: false,
  animationOnCompletion: true,
  stripMetadata: true,
  outputDirectoryName: 'minified'
})

const readonlySettings = readonly(settings)

let settingsReady: Promise<void> | undefined

const ensureSettings = () => {
  settingsReady ??= electron.getSettings().then((snapshot) => {
    Object.assign(settings, snapshot)
  })
  return settingsReady
}

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

const setPngQuality = (quality: number) => {
  const value = getQualityNumber(0, 100, Number(quality))
  settings.pngQuality = value
  persist({ key: 'pngQuality', value })
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

const setStripMetadata = (value: boolean) => {
  settings.stripMetadata = value
  persist({ key: 'stripMetadata', value })
}

const setOutputDirectoryName = (value: string) => {
  const normalized = value.trim().slice(0, 80)
  if (!normalized || /[\\/:]/.test(normalized)) return
  settings.outputDirectoryName = normalized
  persist({ key: 'outputDirectoryName', value: normalized })
}

export const useSettings = () => ({
  settings: readonlySettings,
  settingsReady: ensureSettings(),
  setJpegQuality,
  setPngQuality,
  setConvertToWebp,
  setAddMinSuffix,
  setAddToSubfolder,
  setClearResultList,
  setAnimationOnCompletion,
  setStripMetadata,
  setOutputDirectoryName
})
