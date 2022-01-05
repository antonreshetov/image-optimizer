<template>
  <div
    class="main"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <AppDragArea v-if="!store.showFileList" />
    <AppFileList v-else />
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store'

const store = useStore()

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  console.log('ass')
  store.showFileList = false
}

const onDragLeave = () => {
  // store.showFileList = true
}

</script>

<style lang="scss" scoped>
</style>
