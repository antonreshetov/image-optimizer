<template>
  <section class="options" :class="{ disabled }">
    <div class="option-section">
      <label>Format</label>
      <ToggleGroup
        v-model="outputFormat"
        type="single"
        variant="outline"
        size="sm"
        class="grid grid-cols-2"
      >
        <ToggleGroupItem value="original">Keep format</ToggleGroupItem>
        <ToggleGroupItem value="webp">WebP</ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="option-section">
      <label>JPEG quality</label>
      <div class="range-row">
        <Slider v-model="jpegQuality" :min="1" :max="100" :step="1" />
        <span>{{ jpegQuality[0] }}</span>
      </div>
    </div>

    <div v-if="!convertToWebp" class="option-section">
      <label>PNG quality</label>
      <div class="range-row">
        <Slider v-model="pngQuality" :min="1" :max="100" :step="1" />
        <span>{{ pngQuality[0] }}</span>
      </div>
    </div>

    <small>Lower quality means smaller files.</small>
    <Separator />

    <label class="checkbox-row">
      <Checkbox v-model="stripMetadata" />
      <span>Strip metadata</span>
    </label>

    <Separator />

    <div class="option-section">
      <label>Output</label>
      <label class="checkbox-row">
        <Checkbox v-model="addToSubfolder" />
        <span>Save to output folder</span>
      </label>
      <Input
        :model-value="outputDirectoryName"
        :disabled="!addToSubfolder"
        aria-label="Output folder"
        @change="updateOutputDirectory"
      />
      <small v-if="addToSubfolder"
        >A new folder is created next to each source file.</small
      >
      <small v-else>Optimized files are saved next to their sources.</small>
    </div>

    <Separator />

    <Collapsible v-model:open="advancedOpen" class="advanced-options">
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="xs" class="advanced-options__trigger">
          <ChevronRight :class="{ 'rotate-90': advancedOpen }" />
          Advanced
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent class="advanced-options__content">
        <label class="checkbox-row">
          <Checkbox v-model="addMinSuffix" />
          <span>Add .min suffix</span>
        </label>
        <label class="checkbox-row">
          <Checkbox v-model="clearResultList" />
          <span>Clear previous results on import</span>
        </label>
        <label class="checkbox-row">
          <Checkbox v-model="animationOnCompletion" />
          <span>Completion animation</span>
        </label>
      </CollapsibleContent>
    </Collapsible>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSettings } from '@/composables/useSettings'

defineProps<{ disabled?: boolean }>()
const advancedOpen = ref(false)
const {
  settings,
  setJpegQuality,
  setPngQuality,
  setConvertToWebp,
  setStripMetadata,
  setOutputDirectoryName,
  setAddToSubfolder,
  setAddMinSuffix,
  setClearResultList,
  setAnimationOnCompletion
} = useSettings()

const outputFormat = computed({
  get: () => (settings.convertToWebp ? 'webp' : 'original'),
  set: (value: string | undefined) => {
    if (value) setConvertToWebp(value === 'webp')
  }
})
const convertToWebp = computed(() => settings.convertToWebp)
const jpegQuality = computed<number[]>({
  get: () => [settings.mozjpeg.quality],
  set: ([value]) => value !== undefined && setJpegQuality(value)
})
const pngQuality = computed<number[]>({
  get: () => [settings.pngQuality],
  set: ([value]) => value !== undefined && setPngQuality(value)
})
const stripMetadata = computed({
  get: () => settings.stripMetadata,
  set: setStripMetadata
})
const addToSubfolder = computed({
  get: () => settings.addToSubfolder,
  set: setAddToSubfolder
})
const addMinSuffix = computed({
  get: () => settings.addMinSuffix,
  set: setAddMinSuffix
})
const clearResultList = computed({
  get: () => settings.clearResultList,
  set: setClearResultList
})
const animationOnCompletion = computed({
  get: () => settings.animationOnCompletion,
  set: setAnimationOnCompletion
})
const outputDirectoryName = computed(() => settings.outputDirectoryName)

const updateOutputDirectory = (event: Event) => {
  setOutputDirectoryName((event.target as HTMLInputElement).value)
}
</script>

<style lang="scss" scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.options.disabled {
  opacity: 0.55;
  pointer-events: none;
}
.option-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-section > label:not(.checkbox-row) {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.range-row {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
}
.range-row > span {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  min-width: 28px;
  text-align: right;
}
.options small {
  color: var(--color-text-muted);
  font-size: 10px;
  line-height: 1.45;
}
.checkbox-row {
  align-items: center;
  display: flex;
  gap: 9px;
  font-size: 12px;
  font-weight: 550;
}
.advanced-options__trigger {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 650;
  justify-content: flex-start;
  letter-spacing: 1.1px;
  margin-left: -6px;
  text-transform: uppercase;
}
.advanced-options__trigger svg {
  transition: transform 160ms ease;
}
.advanced-options__content {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding-top: 14px;
}
</style>
