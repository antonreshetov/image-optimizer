<template>
  <div class="settings">
    <h2>Settings</h2>
    <div class="settings__body">
      <AppSettingsRow title="JPEG Quality (mozjpeg)">
        <AppInput
          v-model="jpegQuality"
          type="number"
        />
      </AppSettingsRow>
      <AppSettingsRow title="PNG Quality Range (pngquant)">
        <div class="flex">
          <AppInput
            v-model="pngQualityMin"
            type="number"
            :valid="validatePngQualityRange()"
          />
          -
          <AppInput
            v-model="pngQualityMax"
            type="number"
            :valid="validatePngQualityRange()"
          />
        </div>
      </AppSettingsRow>
      <AppSettingsRow title="Add '.min' suffix to optimized files">
        <AppToggle v-model="addMinSuffix" />
      </AppSettingsRow>
      <AppSettingsRow title="Add optimized file into subfolder 'minified'">
        <AppToggle v-model="addToSubfolder" />
      </AppSettingsRow>
      <AppSettingsRow title="Clear result list when new image added">
        <AppToggle v-model="clearResultList" />
      </AppSettingsRow>
    </div>
  </div>
</template>

<script>
import AppSettingsRow from '@/components/AppSettingsRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import { store } from '@/electron'

export default {
  name: 'AppSettings',

  components: {
    AppSettingsRow,
    AppInput,
    AppToggle
  },

  data () {
    return {
      localJpgQuality: Number(store.get('mozjpeg.quality')),
      localPngQualityMin: Number(store.get('pngquant.qualityMin')),
      localPngQualityMax: Number(store.get('pngquant.qualityMax')),
      localAddMinSuffix: store.get('addMinSuffix'),
      localAddToSubfolder: store.get('addToSubfolder'),
      localClearResultList: store.get('clearResultList')
    }
  },

  computed: {
    jpegQuality: {
      get () {
        return this.localJpgQuality
      },
      set (v) {
        let value = v <= 0 ? 0 : v
        value = value > 100 ? 100 : v
        this.localJpgQuality = Number(value)
        store.set('mozjpeg.quality', this.localJpgQuality)
      }
    },
    pngQualityMin: {
      get () {
        return this.localPngQualityMin
      },
      set (v) {
        let value = v <= 0 ? 0 : v
        value = value > 99 ? 99 : v
        this.localPngQualityMin = Number(value)

        if (this.validatePngQualityRange()) {
          store.set('pngquant.qualityMin', this.localPngQualityMin)
        }
      }
    },
    pngQualityMax: {
      get () {
        return this.localPngQualityMax
      },
      set (v) {
        let value = v <= 0 ? 0 : v
        value = value > 100 ? 100 : v
        this.localPngQualityMax = Number(value)

        if (this.validatePngQualityRange()) {
          store.set('pngquant.qualityMax', this.localPngQualityMax)
        }
      }
    },
    addMinSuffix: {
      get () {
        return this.localAddMinSuffix
      },
      set (v) {
        this.localAddMinSuffix = v
        store.set('addMinSuffix', v)
      }
    },
    addToSubfolder: {
      get () {
        return this.localAddToSubfolder
      },
      set (v) {
        this.localAddToSubfolder = v
        store.set('addToSubfolder', v)
      }
    },
    clearResultList: {
      get () {
        return this.localClearResultList
      },
      set (v) {
        this.localClearResultList = v
        store.set('clearResultList', v)
      }
    }
  },

  methods: {
    validatePngQualityRange () {
      return this.localPngQualityMin < this.localPngQualityMax
    }
  }
}
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
