<template>
  <div
    ref="dragarea"
    class="app-drag-area"
    @drop="onDrop"
    @dragleave="onDragLeave"
  >
    <div class="hero">
      <SvgLogo viewBox="0 0 256 256" width="150" height="150" />
      <h2>Drag files or folder here</h2>
      <p>support only JPG, PNG, GIF and SVG</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import { useOptimizationState } from '@/composables/useOptimizationState'
import type { DroppedFile } from '../../shared/ipc'

const { setFileListVisible } = useOptimizationState()

const onDrop = (e: DragEvent) => {
  e.stopPropagation()
  setFileListVisible(true)

  if (e.dataTransfer?.files) {
    const files = Array.from(e.dataTransfer.files).map((f) => {
      return {
        name: f.name,
        path: electron.getPathForFile(f),
        type: f.type
      } as DroppedFile
    })

    electron.optimizeFiles(files)
  }
}
const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  setFileListVisible(true)
}
</script>

<style lang="scss" scoped>
.app-drag-area {
  border: 2px dashed var(--color-gray-300);
  border-radius: 6px;
  height: calc(100% - var(--toolbar-height) - var(--footer-height) - 4px);
  width: calc(100% - 28px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 1000;
  svg {
    fill: var(--color-gray-300);
  }
}
.hero {
  display: flex;
  flex-flow: column;
  align-items: center;
  user-select: none;
  pointer-events: none;
  h2 {
    margin-bottom: 0;
  }
}
</style>
