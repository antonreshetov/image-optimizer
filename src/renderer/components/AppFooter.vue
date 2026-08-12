<template>
  <div class="footer-status">
    <button v-if="updateStatus.state === 'available'" @click="downloadUpdate">
      Download {{ updateStatus.version }}
    </button>
    <span v-else-if="updateStatus.state === 'downloading'">
      Downloading {{ updateStatus.percent }}%
    </span>
    <button
      v-else-if="updateStatus.state === 'downloaded'"
      @click="installUpdate"
    >
      Restart to update
    </button>
    <span v-else-if="updateStatus.state === 'checking'"
      >Checking for updates…</span
    >
    <span
      v-else-if="updateStatus.state === 'error'"
      :title="updateStatus.message"
    >
      Update check failed
    </span>
  </div>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import type { UpdateStatus } from '../../shared/ipc'
import { onUnmounted, ref } from 'vue'

const updateStatus = ref<UpdateStatus>({ state: 'idle' })
const downloadUpdate = () => void electron.downloadUpdate()
const installUpdate = () => void electron.installUpdate()
const unsubscribe = electron.onUpdateStatus(
  (status) => (updateStatus.value = status)
)
void electron.getUpdateStatus().then((status) => (updateStatus.value = status))
onUnmounted(unsubscribe)
</script>

<style scoped>
.footer-status {
  color: var(--color-text-muted);
  font-size: 10px;
}
.footer-status button {
  background: transparent;
  border: 0;
  color: var(--color-primary);
  height: auto;
  padding: 0;
}
</style>
