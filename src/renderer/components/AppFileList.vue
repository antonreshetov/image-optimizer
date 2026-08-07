<template>
  <div class="list">
    <div class="list__header">
      <div class="list__header-item">
        <div class="label">Original Size:</div>
        <h2>{{ total.originalSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">Optimized Size:</div>
        <h2>{{ total.compressedSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">Compression:</div>
        <h2>{{ total.compressionPercentage }} %</h2>
      </div>
      <div class="list__header-item">
        <div class="label">Current Job Time:</div>
        <h2>{{ state.jobTime }}</h2>
      </div>
    </div>
    <div class="list__body">
      <table>
        <thead>
          <tr>
            <th width="280">Name</th>
            <th>Original Size</th>
            <th>Optimized Size</th>
            <th align="right">Compression</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(i, index) in state.files"
            :key="index"
            :class="(index + 1) % 2 === 0 ? 'event' : 'odd'"
          >
            <td>{{ i.name }}</td>
            <td>{{ i.originalSize.readable }}</td>
            <td>{{ i.compressedSize.readable }}</td>
            <td align="right">{{ i.compressionPercentage }} %</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPreloader v-if="showPreloader" />
  </div>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import { computed, ref, onUnmounted } from 'vue'
import { formatBytes } from '@/utils/formatBytes'
import { useOptimizationState } from '@/composables/useOptimizationState'
import { useSettings } from '@/composables/useSettings'

const { state, addCompletedFile, startOptimization, setJobTime } =
  useOptimizationState()
const { settings } = useSettings()

const total = computed(() => {
  const percentage = Number(
    Math.abs(
      state.totalFiles.compressedSize * (100 / state.totalFiles.originalSize) -
        100
    ).toFixed(2)
  )

  return {
    originalSize: formatBytes(state.totalFiles.originalSize),
    compressedSize: formatBytes(state.totalFiles.compressedSize),
    compressionPercentage: isNaN(percentage) ? 0 : percentage
  }
})

const unsubscribeFileComplete = electron.onFileComplete((file) => {
  addCompletedFile(file)
})

const unsubscribeOptimizationStart = electron.onOptimizationStart(() => {
  showPreloader.value = true
  startOptimization(settings.clearResultList)
})

const unsubscribeOptimizationComplete = electron.onOptimizationComplete(() => {
  showPreloader.value = false
})

const unsubscribeJobTime = electron.onJobTime((time) => {
  setJobTime(time)
})

onUnmounted(() => {
  unsubscribeFileComplete()
  unsubscribeOptimizationStart()
  unsubscribeOptimizationComplete()
  unsubscribeJobTime()
})

const showPreloader = ref(false)
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  font-size: 10px;
  overflow: hidden;
  &__header {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    &-item {
      display: flex;
      flex-flow: column;
      text-align: center;
      h2 {
        margin-top: 0;
      }
    }
  }

  &__body {
    overflow-y: auto;
    height: calc(100vh - var(--footer-height) - 75px);
  }
  table {
    text-align: left;
    width: 100%;
    position: relative;
    border-collapse: collapse;
    th {
      background-color: var(--color-bg);
      position: sticky;
      top: 0;
    }
    tr {
      &.event {
        background: var(--color-table-row-even);
      }
    }
  }
}
</style>
