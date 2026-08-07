<template>
  <div class="settings">
    <h2>Settings</h2>
    <div class="settings__body">
      <AppSettingRow title="JPEG Quality (mozjpeg)">
        <AppInput
          v-model="jpegQuality"
          type="number"
          step="1"
          :valid="jpegQuality > 0"
        />
      </AppSettingRow>
      <AppSettingRow title="PNG Quality Range (pngquant)">
        <div class="flex">
          <AppInput
            v-model="pngQualityMin"
            type="number"
            step="1"
            :valid="isPngQualityRangeValid"
          />
          -
          <AppInput
            v-model="pngQualityMax"
            type="number"
            step="1"
            :valid="isPngQualityRangeValid"
          />
        </div>
      </AppSettingRow>
      <AppSettingRow title="Convert JPG / PNG to WebP">
        <AppToggle v-model="convertToWebp" />
      </AppSettingRow>
      <AppSettingRow title="Add '.min' suffix to optimized files">
        <AppToggle v-model="addMinSuffix" />
      </AppSettingRow>
      <AppSettingRow title="Add optimized file into subfolder 'minified'">
        <AppToggle v-model="addToSubfolder" />
      </AppSettingRow>
      <AppSettingRow title="Clear result list when new image added">
        <AppToggle v-model="clearResultList" />
      </AppSettingRow>
      <AppSettingRow title="Animation on completion">
        <AppToggle v-model="animationOnCompletion" />
      </AppSettingRow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'

const {
  settings,
  setJpegQuality,
  setPngQualityMin,
  setPngQualityMax,
  setConvertToWebp,
  setAddMinSuffix,
  setAddToSubfolder,
  setClearResultList,
  setAnimationOnCompletion
} = useSettings()

const isPngQualityRangeValid = computed(
  () => settings.pngquant.qualityMin < settings.pngquant.qualityMax
)

const jpegQuality = computed({
  get: () => settings.mozjpeg.quality,
  set: setJpegQuality
})
const pngQualityMin = computed({
  get: () => settings.pngquant.qualityMin,
  set: setPngQualityMin
})
const pngQualityMax = computed({
  get: () => settings.pngquant.qualityMax,
  set: setPngQualityMax
})
const convertToWebp = computed({
  get: () => settings.convertToWebp,
  set: setConvertToWebp
})
const addMinSuffix = computed({
  get: () => settings.addMinSuffix,
  set: setAddMinSuffix
})
const addToSubfolder = computed({
  get: () => settings.addToSubfolder,
  set: setAddToSubfolder
})
const clearResultList = computed({
  get: () => settings.clearResultList,
  set: setClearResultList
})
const animationOnCompletion = computed({
  get: () => settings.animationOnCompletion,
  set: setAnimationOnCompletion
})
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
