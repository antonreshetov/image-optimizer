<template>
  <div class="settings">
    <header class="settings__header">
      <Button variant="ghost" size="icon-sm" title="Back" @click="goBack">
        <ArrowLeft />
      </Button>
      <h2>Settings</h2>
    </header>
    <div class="settings__body">
      <AppSettingRow title="JPEG Quality (mozjpeg)">
        <AppInput
          v-model="jpegQuality"
          type="number"
          step="1"
          :valid="jpegQuality > 0"
        />
      </AppSettingRow>
      <AppSettingRow title="PNG Quality (pngquant)">
        <AppInput
          v-model="pngQuality"
          type="number"
          step="1"
          :valid="pngQuality > 0"
        />
      </AppSettingRow>
      <AppSettingRow title="Convert JPG / PNG to WebP">
        <AppToggle v-model="convertToWebp" />
      </AppSettingRow>
      <AppSettingRow title="Add '.min' suffix to optimized files">
        <AppToggle v-model="addMinSuffix" />
      </AppSettingRow>
      <AppSettingRow title="Add optimized file into the output subfolder">
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
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import router from '@/router'
import { useSettings } from '@/composables/useSettings'

const {
  settings,
  setJpegQuality,
  setPngQuality,
  setConvertToWebp,
  setAddMinSuffix,
  setAddToSubfolder,
  setClearResultList,
  setAnimationOnCompletion
} = useSettings()

const jpegQuality = computed({
  get: () => settings.mozjpeg.quality,
  set: setJpegQuality
})
const pngQuality = computed({
  get: () => settings.pngQuality,
  set: setPngQuality
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
const goBack = () => void router.push('/')
</script>

<style lang="scss" scoped>
.settings {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 72px 28px 28px;
}
.settings__header {
  align-items: center;
  display: flex;
  gap: 10px;
  margin: 0 auto 22px;
  max-width: 720px;
}
.settings__header h2 {
  margin: 0;
}
.settings__body {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin: 0 auto;
  max-width: 720px;
  overflow: hidden;
  padding: 0 18px;
}
.flex {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
