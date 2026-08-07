<template>
  <div class="main" @dragover="onDragOver" @dragleave="onDragLeave">
    <AppDragArea v-if="!state.showFileList" />
    <AppFileList v-else />
  </div>
</template>

<script setup lang="ts">
import { useOptimizationState } from '@/composables/useOptimizationState'

const { state, setFileListVisible } = useOptimizationState()

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  setFileListVisible(false)
}

const onDragLeave = () => {
  setFileListVisible(true)
}
</script>

<style lang="scss" scoped></style>
