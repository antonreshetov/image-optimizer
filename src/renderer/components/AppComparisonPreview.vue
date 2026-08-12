<template>
  <section class="preview-section">
    <div class="section-title">
      <span>Preview</span>
      <Button
        v-if="comparisonAvailable"
        variant="ghost"
        size="icon-sm"
        title="Open comparison"
        @click="openComparison"
      >
        <Maximize2 />
      </Button>
    </div>

    <div
      ref="previewElement"
      class="comparison"
      :class="{ loading, empty: !displayedFile }"
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin="5"
      aria-valuemax="95"
      :aria-valuenow="Math.round(position * 100)"
      tabindex="0"
      @pointerdown="startDragging"
      @keydown.left.prevent="position = Math.max(0.05, position - 0.05)"
      @keydown.right.prevent="position = Math.min(0.95, position + 0.05)"
    >
      <template v-if="displayedFile && originalPreview && !samePathOutput">
        <img :src="originalPreview" alt="Original image" draggable="false" />
        <div
          v-if="optimizedPreview"
          class="comparison__after"
          :style="{ clipPath: `inset(0 0 0 ${position * 100}%)` }"
        >
          <img
            :src="optimizedPreview"
            alt="Optimized image"
            draggable="false"
          />
        </div>
        <div
          v-if="optimizedPreview"
          class="comparison__handle"
          :style="{ left: `${position * 100}%` }"
        >
          <i><MoveHorizontal /></i>
        </div>
        <span class="comparison__label before"
          >Before · {{ displayedFile.originalSize.readable }}</span
        >
        <span v-if="displayedFile.output" class="comparison__label after"
          >After · {{ displayedFile.output.compressedSize.readable }}</span
        >
      </template>
      <div v-else class="comparison__placeholder">
        <span>{{ placeholderText }}</span>
      </div>
    </div>

    <p v-if="displayedFile" :title="displayedFile.path">
      {{ displayedFile.name }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import type { OptimizationItem } from '@/types'
import { computed, ref, watch } from 'vue'
import { Maximize2, MoveHorizontal } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ file?: OptimizationItem }>()
const previewElement = ref<HTMLElement>()
const displayedFile = ref<OptimizationItem>()
const originalPreview = ref('')
const optimizedPreview = ref('')
const position = ref(0.5)
const loading = ref(false)
const previewError = ref(false)
let requestId = 0
const samePathOutput = computed(
  () =>
    Boolean(displayedFile.value?.output) &&
    displayedFile.value?.path === displayedFile.value?.output?.outputPath
)
const comparisonAvailable = computed(
  () => Boolean(displayedFile.value?.output) && !samePathOutput.value
)
const placeholderText = computed(() => {
  if (loading.value) return 'Loading preview…'
  if (previewError.value) return 'Preview unavailable'
  if (samePathOutput.value) return 'Original image was replaced'
  return 'Select an image'
})

const preparePreview = async (source: string) => {
  if (!source) return
  const image = new Image()
  image.src = source
  await image.decode()
}

watch(
  () => [props.file?.path, props.file?.output?.outputPath] as const,
  async () => {
    const file = props.file
    const currentRequest = ++requestId
    previewError.value = false
    if (!file) {
      displayedFile.value = undefined
      originalPreview.value = ''
      optimizedPreview.value = ''
      loading.value = false
      return
    }
    loading.value = true
    try {
      const [original, optimized] = await Promise.all([
        electron.getImagePreview(file.path),
        file.output
          ? electron.getImagePreview(file.output.outputPath)
          : Promise.resolve('')
      ])
      await Promise.all([preparePreview(original), preparePreview(optimized)])
      if (requestId === currentRequest) {
        displayedFile.value = file
        originalPreview.value = original
        optimizedPreview.value = optimized
        position.value = 0.5
      }
    } catch {
      if (requestId === currentRequest) {
        displayedFile.value = file
        originalPreview.value = ''
        optimizedPreview.value = ''
        previewError.value = true
      }
    } finally {
      if (requestId === currentRequest) loading.value = false
    }
  },
  { immediate: true }
)

const updatePosition = (event: PointerEvent) => {
  const bounds = previewElement.value?.getBoundingClientRect()
  if (!bounds) return
  position.value = Math.min(
    0.95,
    Math.max(0.05, (event.clientX - bounds.left) / bounds.width)
  )
}

const startDragging = (event: PointerEvent) => {
  if (!comparisonAvailable.value || !optimizedPreview.value) return
  updatePosition(event)
  const move = (moveEvent: PointerEvent) => updatePosition(moveEvent)
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
}

const openComparison = () => {
  const output = displayedFile.value?.output
  if (!output || !comparisonAvailable.value) return
  void electron.openComparison({
    path: output.path,
    outputPath: output.outputPath
  })
}
</script>

<style lang="scss" scoped>
.section-title {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  font-size: 10px;
  font-weight: 650;
  justify-content: space-between;
  letter-spacing: 1.1px;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.section-title button {
  color: var(--color-text-muted);
}
.comparison {
  background-color: var(--color-preview);
  background-image:
    linear-gradient(45deg, var(--color-checker) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-checker) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-checker) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-checker) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: col-resize;
  aspect-ratio: 1.56;
  overflow: hidden;
  position: relative;
  user-select: none;
}
.comparison img {
  height: 100%;
  left: 0;
  object-fit: contain;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}
.comparison__after {
  inset: 0;
  position: absolute;
}
.comparison__handle {
  background: rgb(255 255 255 / 92%);
  bottom: 0;
  box-shadow: 0 0 4px rgb(0 0 0 / 45%);
  position: absolute;
  top: 0;
  width: 2px;
}
.comparison__handle i {
  align-items: center;
  backdrop-filter: blur(8px);
  background: rgb(44 44 48 / 82%);
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 50%;
  color: white;
  display: flex;
  font-style: normal;
  height: 28px;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
}
.comparison__handle svg {
  height: 13px;
  width: 13px;
}
.comparison__label {
  backdrop-filter: blur(8px);
  background: rgb(125 125 128 / 78%);
  border-radius: 5px;
  bottom: 8px;
  color: white;
  font-size: 9px;
  font-weight: 650;
  padding: 4px 7px;
  position: absolute;
}
.comparison__label.before {
  left: 8px;
}
.comparison__label.after {
  right: 8px;
}
.comparison__placeholder {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
}
.preview-section p {
  font-size: 12px;
  margin: 10px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
