<template>
  <div class="file-list">
    <div class="file-list__header file-grid">
      <span>Name</span>
      <span>Original</span>
      <span>Optimized</span>
      <span>Saved</span>
      <span>Status</span>
    </div>
    <ScrollArea v-if="state.files.length" class="file-list__body">
      <div class="file-list__rows">
        <button
          v-for="file in state.files"
          :key="file.path"
          class="file-row file-grid"
          :class="{ selected: file.path === state.selectedPath }"
          type="button"
          @click="selectFile(file.path)"
          @contextmenu.prevent="openContextMenu(file.path)"
        >
          <span class="file-name">
            <AppThumbnail :path="file.path" />
            <span :title="file.path">{{ file.name }}</span>
          </span>
          <span>{{ file.originalSize.readable }}</span>
          <span class="optimized">{{
            file.output?.compressedSize.readable ?? '—'
          }}</span>
          <span>{{
            file.output
              ? `${Math.round(file.output.compressionPercentage)}%`
              : '—'
          }}</span>
          <span
            ><em :class="file.status" :title="file.error">{{
              statusLabel(file.status)
            }}</em></span
          >
        </button>
      </div>
    </ScrollArea>
    <div v-else class="file-list__empty">
      <span class="spinner" />
      <strong>Optimizing images…</strong>
      <small>Results will appear here as they finish.</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOptimizationState } from '@/composables/useOptimizationState'
import type { OptimizationItem } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'

import { electron } from '@/electron'

const { state, selectFile, removeFile } = useOptimizationState()
const openContextMenu = async (path: string) => {
  selectFile(path)
  const action = await electron.showFileContextMenu(!state.isOptimizing)
  if (action === 'remove') removeFile(path)
}
const statusLabel = (status: OptimizationItem['status']) =>
  ({
    pending: 'Pending',
    running: 'Optimizing',
    completed: 'Done',
    failed: 'Failed'
  })[status]
</script>

<style lang="scss" scoped>
.file-list {
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: 36px minmax(0, 1fr);
}
.file-grid {
  align-items: center;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(180px, 1fr) 82px 88px 64px 76px;
  padding: 0 24px;
}
.file-list__header {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.file-list__header span:not(:first-child),
.file-row > span:not(:first-child) {
  text-align: right;
}
.file-list__body {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.file-list__rows {
  min-width: 100%;
}
.file-row {
  background: transparent;
  border: 0;
  border-radius: 0;
  color: var(--color-text);
  height: 62px;
  width: 100%;
}
.file-row:hover {
  background: var(--color-surface);
}
.file-row.selected {
  background: var(--color-selection);
}
.file-row > span {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.file-name {
  align-items: center;
  display: flex;
  gap: 12px;
  min-width: 0;
  text-align: left !important;
}
.file-name > span:last-child {
  font-weight: 550;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.optimized {
  color: var(--color-primary);
}
em {
  background: var(--color-surface-raised);
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-style: normal;
  font-weight: 650;
  padding: 4px 9px;
}
em.completed {
  background: var(--color-accent-soft);
  color: var(--color-primary);
}
em.failed {
  background: rgb(255 69 58 / 14%);
  color: #ff6961;
}
.file-list__empty {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.file-list__empty strong {
  color: var(--color-text);
}
.spinner {
  animation: spin 0.8s linear infinite;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  height: 20px;
  width: 20px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
