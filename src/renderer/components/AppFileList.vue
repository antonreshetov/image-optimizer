<template>
  <div class="list">
    <div class="list__header">
      <div class="list__header-item">
        <div class="label">
          Original Size:
        </div>
        <h2>{{ total.originalSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Optimized Size:
        </div>
        <h2>{{ total.compressedSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Compression:
        </div>
        <h2>{{ total.compressionPercentage }} %</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Current Job Time:
        </div>
        <h2>{{ store.jobTime }}</h2>
      </div>
    </div>
    <div class="list__body">
      <table>
        <thead>
          <tr>
            <th width="280">
              Name
            </th>
            <th>Original Size</th>
            <th>Optimized Size</th>
            <th align="right">
              Compression
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(i, index) in store.files"
            :key="index"
            :class="(index + 1) % 2 === 0 ? 'event' : 'odd'"
          >
            <td>{{ i.name }}</td>
            <td>{{ i.originalSize.readable }}</td>
            <td>{{ i.compressedSize.readable }}</td>
            <td align="right">
              {{ i.compressionPercentage }} %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPreloader v-if="showPreloader" />
  </div>
</template>

<script setup lang="ts">
import { ipc, store as electronStore } from '@/electron'
import { computed, ref, onUnmounted } from 'vue'
import type { FileOutput } from '../../main/types'
import { formatBytes } from '../../main/utils'
import { useStore } from '@/store'

const store = useStore()

const total = computed(() => {
  const percentage = Number(
    Math.abs(
      store.totalFiles.compressedSize * (100 / store.totalFiles.originalSize) -
        100
    ).toFixed(2)
  )

  return {
    originalSize: formatBytes(store.totalFiles.originalSize),
    compressedSize: formatBytes(store.totalFiles.compressedSize),
    compressionPercentage: isNaN(percentage) ? 0 : percentage
  }
})

ipc.on('file-complete', (_, file: FileOutput) => {
  store.files.push(file)
  store.totalFiles.originalSize += file.originalSize.bytes
  store.totalFiles.compressedSize += file.compressedSize.bytes
})

ipc.on('optimization-start', () => {
  if (electronStore.get('clearResultList')) {
    store.files = []
  }
  store.jobTime = '-'
})

ipc.on('job-time', (_, time) => {
  store.jobTime = time
})

onUnmounted(() => {
  ipc.removeListeners('file-complete')
  ipc.removeListeners('optimization-start')
  ipc.removeListeners('job-time')
})
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
