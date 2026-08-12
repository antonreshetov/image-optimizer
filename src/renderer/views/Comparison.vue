<template>
  <div class="comparison-window">
    <header v-if="file" class="comparison-header">
      <strong>{{ file.name }}</strong>
      <div class="comparison-header__metrics">
        <Metric label="Original" :value="file.originalSize.readable" />
        <span>→</span>
        <Metric
          label="Optimized"
          :value="file.compressedSize.readable"
          accent
        />
      </div>
    </header>

    <div class="zoom-controls">
      <Button variant="outline" size="icon" @click="setZoom(zoom - 0.25)"
        ><ZoomOut
      /></Button>
      <Slider v-model="zoomValue" :min="0.25" :max="4" :step="0.05" />
      <span>{{ Math.round(zoom * 100) }}%</span>
      <Button variant="outline" size="icon" @click="setZoom(zoom + 0.25)"
        ><ZoomIn
      /></Button>
      <Button variant="outline" @click="resetView">Fit</Button>
    </div>

    <main class="comparison-stage">
      <div v-if="loading" class="comparison-error">Loading comparison…</div>
      <div v-else-if="previewError || !file" class="comparison-error">
        Comparison unavailable
      </div>
      <div
        v-else
        ref="canvasElement"
        class="comparison-canvas"
        :class="{
          'pan-ready': canPan && spacePressed,
          panning: isPanning
        }"
        :style="canvasStyle"
        role="slider"
        aria-label="Before and after comparison"
        aria-valuemin="5"
        aria-valuemax="95"
        :aria-valuenow="Math.round(position * 100)"
        tabindex="0"
        @pointerenter="pointerInsideCanvas = true"
        @pointerleave="pointerInsideCanvas = false"
        @pointerdown="startDragging"
        @keydown.left.prevent="position = Math.max(0.05, position - 0.05)"
        @keydown.right.prevent="position = Math.min(0.95, position + 0.05)"
      >
        <img
          v-if="originalPreview"
          :src="originalPreview"
          alt="Original image"
          draggable="false"
        />
        <div
          class="comparison-canvas__after"
          :style="{ clipPath: `inset(0 0 0 ${position * 100}%)` }"
        >
          <img
            v-if="optimizedPreview"
            :src="optimizedPreview"
            alt="Optimized image"
            draggable="false"
          />
        </div>
        <div
          class="comparison-canvas__handle"
          :style="{ left: `${position * 100}%` }"
        >
          <i><MoveHorizontal /></i>
        </div>
        <span class="preview-label before"
          >Before · {{ file.originalSize.readable }}</span
        >
        <span class="preview-label after"
          >After · {{ file.compressedSize.readable }}</span
        >
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { electron } from '@/electron'
import type { ComparisonPayload } from '../../shared/ipc'
import { MoveHorizontal, ZoomIn, ZoomOut } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const Metric = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    accent: Boolean
  },
  setup: (props) => () =>
    h('div', { class: ['metric', { accent: props.accent }] }, [
      h('span', props.label),
      h('strong', props.value)
    ])
})

const file = ref<ComparisonPayload>()
const originalPreview = ref('')
const optimizedPreview = ref('')
const canvasElement = ref<HTMLElement>()
const position = ref(0.5)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const spacePressed = ref(false)
const isPanning = ref(false)
const pointerInsideCanvas = ref(false)
const previewError = ref(false)
const loading = ref(true)
let stopPanListeners: (() => void) | undefined

const canPan = computed(() => zoom.value > 1)
const zoomValue = computed<number[]>({
  get: () => [zoom.value],
  set: ([value]) => {
    if (value !== undefined) setZoom(value)
  }
})
const canvasStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`
}))

const clampPan = () => {
  const canvas = canvasElement.value
  if (!canvas || !canPan.value) {
    panX.value = 0
    panY.value = 0
    return
  }
  const maximumX = (canvas.clientWidth * (zoom.value - 1)) / 2
  const maximumY = (canvas.clientHeight * (zoom.value - 1)) / 2
  panX.value = Math.max(-maximumX, Math.min(maximumX, panX.value))
  panY.value = Math.max(-maximumY, Math.min(maximumY, panY.value))
}

const setZoom = (value: number) => {
  zoom.value = Math.max(0.25, Math.min(4, value))
}

const resetView = () => {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

watch(zoom, clampPan)

const stopPanning = () => {
  stopPanListeners?.()
  stopPanListeners = undefined
  isPanning.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code !== 'Space' || !canPan.value || !pointerInsideCanvas.value)
    return
  event.preventDefault()
  spacePressed.value = true
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.code !== 'Space') return
  spacePressed.value = false
  stopPanning()
}

const handleBlur = () => {
  spacePressed.value = false
  stopPanning()
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleBlur)
  try {
    file.value = await electron.getComparisonPayload()
    ;[originalPreview.value, optimizedPreview.value] = await Promise.all([
      electron.getImagePreview(file.value.path),
      electron.getImagePreview(file.value.outputPath)
    ])
  } catch {
    previewError.value = true
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', handleBlur)
  stopPanning()
})

const updatePosition = (event: PointerEvent) => {
  const bounds = canvasElement.value?.getBoundingClientRect()
  if (!bounds) return
  position.value = Math.min(
    0.95,
    Math.max(0.05, (event.clientX - bounds.left) / bounds.width)
  )
}

const startDragging = (event: PointerEvent) => {
  if (spacePressed.value && canPan.value && event.button === 0) {
    event.preventDefault()
    isPanning.value = true
    const startX = event.clientX - panX.value
    const startY = event.clientY - panY.value
    const move = (moveEvent: PointerEvent) => {
      panX.value = moveEvent.clientX - startX
      panY.value = moveEvent.clientY - startY
      clampPan()
    }
    const stop = () => stopPanning()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
    stopPanListeners = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    return
  }

  updatePosition(event)
  const move = (moveEvent: PointerEvent) => updatePosition(moveEvent)
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
}
</script>

<style lang="scss" scoped>
.comparison-window {
  display: grid;
  grid-template-rows: 72px minmax(0, 1fr);
  height: 100%;
  padding-top: 44px;
  box-sizing: border-box;
}
.comparison-header {
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  padding: 0 20px;
}
.comparison-header__metrics {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-left: auto;
}
:deep(.metric) {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 78px;
}
:deep(.metric span) {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1px;
  text-transform: uppercase;
}
:deep(.metric strong) {
  font-size: 12px;
}
:deep(.metric.accent strong) {
  color: var(--color-primary);
}
.zoom-controls {
  align-items: center;
  display: flex;
  gap: 8px;
  position: absolute;
  right: 12px;
  top: 10px;
  z-index: 30;
}
.zoom-controls > :deep([data-slot='slider']) {
  width: 160px;
}
.zoom-controls span {
  font-size: 10px;
  width: 42px;
}
.comparison-stage {
  align-items: center;
  background: var(--color-preview);
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.comparison-error {
  color: var(--color-text-muted);
  font-size: 14px;
}
.comparison-canvas {
  background: inherit;
  border: 0;
  cursor: col-resize;
  flex: 0 0 auto;
  height: 100%;
  overflow: hidden;
  position: relative;
  transform-origin: center;
  width: 100%;
}
.comparison-canvas:focus {
  outline: none;
}
.comparison-canvas.pan-ready {
  cursor: grab;
}
.comparison-canvas.panning {
  cursor: grabbing;
}
.comparison-canvas img {
  height: 100%;
  inset: 0;
  object-fit: contain;
  position: absolute;
  user-select: none;
  width: 100%;
}
.comparison-canvas__after {
  inset: 0;
  position: absolute;
}
.comparison-canvas__handle {
  background: rgb(255 255 255 / 94%);
  bottom: 0;
  box-shadow: 0 0 4px rgb(0 0 0 / 44%);
  position: absolute;
  top: 0;
  width: 2px;
}
.comparison-canvas__handle i {
  align-items: center;
  background: rgb(130 104 55 / 92%);
  border-radius: 50%;
  color: white;
  display: flex;
  font-style: normal;
  height: 34px;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 34px;
}
.comparison-canvas__handle svg {
  height: 15px;
  width: 15px;
}
.preview-label {
  background: rgb(20 20 22 / 70%);
  border-radius: 5px;
  bottom: 12px;
  color: white;
  font-size: 10px;
  padding: 5px 8px;
  position: absolute;
  text-transform: uppercase;
}
.preview-label.before {
  left: 12px;
}
.preview-label.after {
  color: var(--color-primary);
  right: 12px;
}
</style>
