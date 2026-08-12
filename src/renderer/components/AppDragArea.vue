<template>
  <div class="drop-area">
    <div class="drop-area__icon">
      <Images />
    </div>
    <h1>Drop images or folders</h1>
    <p>JPEG, PNG, GIF and SVG files</p>
    <Button type="button" size="sm" @click="addImages">Add Images…</Button>
  </div>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import { useOptimizationState } from '@/composables/useOptimizationState'
import type { DroppedFile } from '../../shared/ipc'
import { Images } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const { addPendingFiles } = useOptimizationState()
import { useSettings } from '@/composables/useSettings'
const { settings } = useSettings()

const addFiles = async (files: DroppedFile[]) => {
  if (!files.length) return
  addPendingFiles(await electron.prepareFiles(files), settings.clearResultList)
}

const addImages = async () => addFiles(await electron.chooseFiles())
</script>

<style lang="scss" scoped>
.drop-area {
  align-items: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  inset: 16px 28px 28px;
  justify-content: center;
  padding-top: 12px;
  position: absolute;
}
.drop-area__icon {
  align-items: center;
  background: var(--color-surface-raised);
  border-radius: 14px;
  color: var(--color-text-muted);
  display: flex;
  height: 78px;
  justify-content: center;
  width: 96px;
}
.drop-area__icon svg {
  height: 34px;
  width: 34px;
}
h1 {
  font-size: 15px;
  font-weight: 650;
  margin: 16px 0 0;
}
p {
  color: var(--color-text-muted);
  margin: 7px 0 14px;
}
</style>
