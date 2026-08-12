<template>
  <div
    class="main-view"
    @dragover.prevent="isDragging = true"
    @dragleave.self="isDragging = false"
    @drop.prevent="onDrop"
  >
    <div
      class="workspace"
      :class="{ 'workspace--wide': !state.inspectorVisible }"
    >
      <section class="content-pane">
        <AppDragArea v-if="!state.showFileList" />

        <template v-else>
          <header class="summary">
            <div
              class="summary__donut"
              :aria-label="
                completedCount
                  ? `${donutPercentage}% smaller`
                  : 'Savings unavailable before optimization'
              "
              role="img"
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="summary__donut-track" cx="50" cy="50" r="42" />
                <circle
                  v-if="completedCount"
                  class="summary__donut-value"
                  cx="50"
                  cy="50"
                  r="42"
                  pathLength="100"
                  :stroke-dasharray="`${animatedDonutPercentage} ${100 - animatedDonutPercentage}`"
                />
              </svg>
              <div>
                <strong ref="donutValueElement">{{
                  completedCount ? '' : '—'
                }}</strong>
                <span>smaller</span>
              </div>
            </div>
            <div class="summary__primary">
              <span>{{ phaseLabel }}</span>
              <div>
                <strong v-if="showOriginalValue">{{ summary.original }}</strong>
                <strong v-else ref="savedValueElement" />
                <small>{{
                  showOriginalValue
                    ? `across ${state.files.length} images`
                    : `of ${summary.original} processed`
                }}</small>
              </div>
            </div>
            <div class="summary__metrics">
              <Metric
                label="Original"
                :value="summary.original"
                tone="original"
              />
              <Metric
                label="Optimized"
                :value="completedCount ? summary.optimized : '—'"
                tone="optimized"
              />
              <Metric label="Elapsed" :value="state.jobTime" />
            </div>
            <div class="progress-track">
              <div :style="{ width: `${progressPercentage}%` }" />
            </div>
          </header>

          <AppFileList />

          <footer class="action-bar">
            <div class="action-bar__group">
              <Button
                variant="secondary"
                size="icon-sm"
                class="action-bar__icon-button"
                title="Add images"
                @click="addImages"
                ><Plus
              /></Button>
              <Button
                variant="secondary"
                size="icon-sm"
                class="action-bar__icon-button"
                title="Clear list"
                :disabled="!state.files.length || state.isOptimizing"
                @click="clearResults"
              >
                <Trash2 />
              </Button>
            </div>
            <span v-if="completedCount" class="action-summary">
              {{ completedCount }}
              {{ completedCount === 1 ? 'image' : 'images' }} optimized
            </span>
            <Button
              v-if="pendingFiles.length"
              :disabled="state.isOptimizing"
              size="sm"
              @click="runOptimization"
            >
              Optimize
            </Button>
            <Button
              v-else-if="selectedFile?.output"
              variant="secondary"
              size="sm"
              class="action-bar__text-button"
              @click="revealSelected"
              >{{ revealInFileManagerLabel }}</Button
            >
          </footer>
        </template>
      </section>

      <aside
        class="inspector"
        :class="{ 'inspector--hidden': !state.inspectorVisible }"
        :aria-hidden="!state.inspectorVisible"
        :inert="!state.inspectorVisible"
      >
        <div class="inspector__content">
          <div v-if="state.showFileList" class="inspector__preview">
            <AppComparisonPreview :file="selectedFile" />
          </div>
          <ScrollArea class="inspector__settings">
            <div class="inspector__settings-content">
              <OptimizationInspector :disabled="state.isOptimizing" />
            </div>
          </ScrollArea>
        </div>
      </aside>
    </div>

    <div v-if="isDragging && state.showFileList" class="drop-overlay">
      <strong>Drop images or folders</strong>
      <span>JPEG, PNG, GIF and SVG</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { CountUp } from 'countup.js'
import { electron } from '@/electron'
import { formatBytes } from '@/utils/formatBytes'
import { useOptimizationState } from '@/composables/useOptimizationState'
import { useSettings } from '@/composables/useSettings'
import type { DroppedFile } from '../../shared/ipc'
import { Plus, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const Metric = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    tone: { type: String, default: '' }
  },
  setup: (props) => () =>
    h('div', { class: 'metric' }, [
      h('i', { class: ['metric__marker', props.tone] }),
      h('span', props.label),
      h('strong', props.value)
    ])
})

const {
  state,
  addPendingFiles,
  addCompletedFile,
  failFile,
  startOptimization,
  finishOptimization,
  setJobTime,
  clearResults
} = useOptimizationState()
const { settings } = useSettings()
const isDragging = ref(false)
const revealInFileManagerLabel =
  electron.platform === 'darwin'
    ? 'Reveal in Finder'
    : electron.platform === 'win32'
      ? 'Show in Explorer'
      : 'Show in File Manager'
const donutValueElement = ref<HTMLElement>()
const savedValueElement = ref<HTMLElement>()
const animatedDonutPercentage = ref(0)
const animationDuration = 1.6
let donutCountUp: CountUp | undefined
let savedCountUp: CountUp | undefined
let donutAnimationFrame: number | undefined

const selectedFile = computed(() =>
  state.files.find((file) => file.path === state.selectedPath)
)

const summary = computed(() => {
  const completed = state.files.filter((file) => file.output)
  const completedOriginal = completed.reduce(
    (total, file) => total + (file.output?.originalSize.bytes ?? 0),
    0
  )
  const completedCompressed = completed.reduce(
    (total, file) => total + (file.output?.compressedSize.bytes ?? 0),
    0
  )
  const saved = Math.max(0, completedOriginal - completedCompressed)
  return {
    original: formatBytes(state.totalFiles.originalSize),
    optimized: formatBytes(state.totalFiles.compressedSize),
    savedBytes: saved,
    percentage: completedOriginal
      ? Math.round(
          ((completedOriginal - completedCompressed) / completedOriginal) * 100
        )
      : 0
  }
})

const pendingFiles = computed(() =>
  state.files.filter((file) => file.status === 'pending')
)
const completedCount = computed(
  () => state.files.filter((file) => file.status === 'completed').length
)
const failedCount = computed(
  () => state.files.filter((file) => file.status === 'failed').length
)
const progressPercentage = computed(() => {
  if (!state.files.length) return 0
  return Math.round(
    ((completedCount.value + failedCount.value) / state.files.length) * 100
  )
})

const donutPercentage = computed(() =>
  Math.max(0, Math.min(100, summary.value.percentage))
)
const showOriginalValue = computed(() =>
  Boolean(pendingFiles.value.length && !state.isOptimizing)
)
const phaseLabel = computed(() => {
  if (state.isOptimizing) return 'Optimizing'
  if (pendingFiles.value.length) return 'Ready to optimize'
  return failedCount.value ? 'Completed with errors' : 'Saved'
})

const destroyCountUp = (animation: CountUp | undefined) => {
  animation?.onDestroy()
  return undefined
}

watch(
  [completedCount, donutPercentage],
  async ([count, percentage]) => {
    if (donutAnimationFrame !== undefined) {
      window.cancelAnimationFrame(donutAnimationFrame)
      donutAnimationFrame = undefined
    }

    if (!count) {
      animatedDonutPercentage.value = 0
      donutCountUp = destroyCountUp(donutCountUp)
      return
    }

    await nextTick()

    if (!donutCountUp && donutValueElement.value) {
      donutCountUp = new CountUp(donutValueElement.value, percentage, {
        duration: animationDuration,
        startVal: 0,
        suffix: '%',
        useGrouping: false
      })
      if (!donutCountUp.error) donutCountUp.start()
    } else {
      donutCountUp?.update(percentage)
    }

    donutAnimationFrame = window.requestAnimationFrame(() => {
      animatedDonutPercentage.value = percentage
      donutAnimationFrame = undefined
    })
  },
  { flush: 'post' }
)

watch(
  [
    () => summary.value.savedBytes,
    () => state.totalFiles.originalSize,
    () => state.isOptimizing,
    showOriginalValue
  ],
  async ([savedBytes, originalBytes, isOptimizing, showOriginal]) => {
    if (showOriginal || !originalBytes) {
      savedCountUp = destroyCountUp(savedCountUp)
      return
    }

    await nextTick()
    if (!savedValueElement.value) return

    if (isOptimizing || !savedBytes) {
      savedCountUp = destroyCountUp(savedCountUp)
      savedValueElement.value.textContent = formatBytes(originalBytes)
      return
    }

    if (!savedCountUp) {
      savedCountUp = new CountUp(savedValueElement.value, savedBytes, {
        duration: animationDuration,
        startVal: originalBytes,
        formattingFn: formatBytes,
        smartEasingThreshold: Number.MAX_SAFE_INTEGER,
        useGrouping: false
      })
      if (!savedCountUp.error) savedCountUp.start()
    } else {
      savedCountUp.update(savedBytes)
    }
  },
  { flush: 'post' }
)

const importFiles = async (files: DroppedFile[]) => {
  if (!files.length || state.isOptimizing) return
  addPendingFiles(await electron.prepareFiles(files), settings.clearResultList)
}

const addImages = async () => importFiles(await electron.chooseFiles())

const runOptimization = () => {
  electron.optimizeFiles(
    pendingFiles.value.map(({ name, path, type }) => ({ name, path, type }))
  )
}

const onDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? []).map((file) => ({
    name: file.name,
    path: electron.getPathForFile(file),
    type: file.type
  }))
  void importFiles(files)
}

const revealSelected = () => {
  if (selectedFile.value?.output)
    void electron.revealOutput(selectedFile.value.output.outputPath)
}

const unsubscribers = [
  electron.onFileComplete(addCompletedFile),
  electron.onFileFailed(failFile),
  electron.onOptimizationStart(startOptimization),
  electron.onOptimizationComplete(finishOptimization),
  electron.onJobTime(setJobTime)
]
onUnmounted(() => {
  unsubscribers.forEach((unsubscribe) => unsubscribe())
  donutCountUp?.onDestroy()
  savedCountUp?.onDestroy()
  if (donutAnimationFrame !== undefined)
    window.cancelAnimationFrame(donutAnimationFrame)
})
</script>

<style lang="scss" scoped>
.main-view {
  height: 100%;
  padding-top: 44px;
  box-sizing: border-box;
  position: relative;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  height: 100%;
  min-height: 0;
  position: relative;
  transition: grid-template-columns 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.workspace--wide {
  grid-template-columns: minmax(0, 1fr) 0;
}
.content-pane {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  position: relative;
}
.summary {
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  column-gap: 20px;
  display: grid;
  grid-template-columns: 96px minmax(150px, 1fr) minmax(190px, 210px);
  grid-template-rows: auto 6px;
  min-height: 132px;
  padding: 14px 24px 12px;
  row-gap: 12px;
}
.summary__donut {
  height: 88px;
  position: relative;
  width: 88px;
}
.summary__donut svg {
  display: block;
  height: 100%;
  overflow: visible;
  transform: rotate(-90deg);
  width: 100%;
}
.summary__donut circle {
  fill: none;
  stroke-width: 11;
}
.summary__donut-track {
  stroke: var(--color-surface-raised);
}
.summary__donut-value {
  stroke: var(--color-primary);
  stroke-linecap: round;
  transition: stroke-dasharray 1.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.summary__donut > div {
  align-items: center;
  display: flex;
  flex-direction: column;
  inset: 0;
  justify-content: center;
  position: absolute;
}
.summary__donut strong {
  color: var(--color-primary);
  font-size: 23px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.summary__donut span {
  color: var(--color-text-muted);
  font-size: 8px;
  font-weight: 650;
  letter-spacing: 1.1px;
  margin-top: 5px;
  text-transform: uppercase;
}
.summary__primary {
  min-width: 150px;
}
.summary__primary > span,
.metric span {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.summary__primary > div {
  align-items: baseline;
  display: flex;
  gap: 8px;
  margin-top: 5px;
}
.summary__primary strong {
  color: var(--color-primary);
  font-size: 36px;
  letter-spacing: -1.4px;
  line-height: 1;
}
.summary__primary small {
  color: var(--color-text-muted);
  font-size: 11px;
}
.summary__metrics {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
:deep(.metric) {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  min-width: 0;
}
:deep(.metric__marker) {
  background: transparent;
  border-radius: 2px;
  height: 7px;
  width: 7px;
}
:deep(.metric__marker.original) {
  background: var(--color-text-muted);
}
:deep(.metric__marker.optimized) {
  background: var(--color-primary);
}
:deep(.metric span) {
  letter-spacing: 0;
  text-transform: none;
}
:deep(.metric strong) {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.progress-track {
  background: var(--color-surface-raised);
  border-radius: 999px;
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  width: 100%;
}
.progress-track div {
  background: var(--color-primary);
  height: 100%;
  transition: width 180ms ease;
}
.action-bar {
  align-items: center;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  min-height: 52px;
  padding: 8px 16px;
  position: relative;
  z-index: 2;
}
.action-bar__group {
  display: flex;
  gap: 7px;
  margin-right: auto;
}
.action-bar__icon-button {
  height: 30px;
  width: 30px;
}
.action-bar__text-button {
  height: 30px;
}
.inspector {
  background: var(--color-inspector);
  min-width: 0;
  overflow: hidden;
}
.inspector__content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transform: translateX(0);
  transition:
    opacity 160ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  width: 310px;
}
.inspector__preview {
  border-bottom: 1px solid var(--color-border);
  flex: none;
  padding: 18px;
}
.inspector__settings {
  flex: 1;
  min-height: 0;
}
.inspector__settings-content {
  padding: 18px;
}
.inspector--hidden {
  pointer-events: none;
}
.inspector--hidden .inspector__content {
  opacity: 0;
  transform: translateX(100%);
}
.drop-overlay {
  align-items: center;
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--color-bg) 84%, transparent);
  border: 1px dashed var(--color-primary);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  inset: 60px 18px 18px;
  justify-content: center;
  position: absolute;
  z-index: 30;
}
.drop-overlay span {
  color: var(--color-text-muted);
}
@media (max-width: 820px) {
  .summary__metrics {
    gap: 12px;
  }
}
</style>
