<template>
  <div v-if="isVisible" class="update-control" aria-live="polite">
    <Button
      v-if="updateStatus.state === 'available'"
      variant="ghost"
      size="icon-sm"
      :title="`Download update ${updateStatus.version}`"
      :aria-label="`Download update ${updateStatus.version}`"
      @click="downloadUpdate"
    >
      <Download />
    </Button>
    <span
      v-else-if="updateStatus.state === 'downloading'"
      class="update-control__progress"
      :title="`Downloading update: ${updateStatus.percent}%`"
    >
      {{ updateStatus.percent }}%
    </span>
    <Button
      v-else-if="updateStatus.state === 'downloaded'"
      variant="ghost"
      size="icon-sm"
      :title="`Restart to install update ${updateStatus.version}`"
      :aria-label="`Restart to install update ${updateStatus.version}`"
      @click="installUpdate"
    >
      <RotateCw />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { electron } from '@/electron'
import { Download, RotateCw } from '@lucide/vue'
import type { UpdateStatus } from '../../shared/ipc'
import { computed, onUnmounted, ref } from 'vue'

const updateStatus = ref<UpdateStatus>({ state: 'idle' })
const isVisible = computed(() =>
  ['available', 'downloading', 'downloaded'].includes(updateStatus.value.state)
)
const downloadUpdate = () => void electron.downloadUpdate()
const installUpdate = () => void electron.installUpdate()
const unsubscribe = electron.onUpdateStatus(
  (status) => (updateStatus.value = status)
)
void electron.getUpdateStatus().then((status) => (updateStatus.value = status))
onUnmounted(unsubscribe)
</script>

<style scoped>
.update-control {
  align-items: center;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}
.update-control__progress {
  align-items: center;
  background: var(--color-accent);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  display: inline-flex;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  height: 28px;
  justify-content: center;
  min-width: 38px;
  padding: 0 7px;
}
</style>
