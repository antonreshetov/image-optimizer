<template>
  <div class="footer">
    <div class="actions">
      <button
        v-if="updateStatus.state === 'available'"
        class="actions-item update"
        type="button"
        @click="downloadUpdate"
      >
        <span>Download {{ updateStatus.version }}</span>
        <SvgArrowCircleUp />
      </button>
      <div
        v-else-if="updateStatus.state === 'downloading'"
        class="actions-item update-status"
      >
        <span>Downloading {{ updateStatus.percent }}%</span>
      </div>
      <button
        v-else-if="updateStatus.state === 'downloaded'"
        class="actions-item update"
        type="button"
        @click="installUpdate"
      >
        <span>Restart to update</span>
        <SvgArrowCircleUp />
      </button>
      <div
        v-else-if="updateStatus.state === 'checking'"
        class="actions-item update-status"
      >
        <span>Checking for updates…</span>
      </div>
      <div
        v-else-if="updateStatus.state === 'not-available'"
        class="actions-item update-status"
      >
        <span>Up to date</span>
      </div>
      <div
        v-else-if="updateStatus.state === 'error'"
        class="actions-item update-status"
        :title="updateStatus.message"
      >
        <span>Update check failed</span>
      </div>
      <RouterLink v-slot="{ navigate }" to="/settings" custom>
        <div
          v-if="showSettingsButton"
          class="actions-item settings"
          @click="navigate"
        >
          <SvgCog />
        </div>
      </RouterLink>
      <RouterLink v-slot="{ navigate }" to="/" custom>
        <div
          v-if="!showSettingsButton"
          class="actions-item settings"
          @click="navigate"
        >
          <SvgTimes />
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { electron } from '@/electron'
import type { UpdateStatus } from '../../shared/ipc'
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const updateStatus = ref<UpdateStatus>({ state: 'idle' })
const showSettingsButton = computed(() => route.path === '/')

const downloadUpdate = () => {
  void electron.downloadUpdate()
}

const installUpdate = () => {
  void electron.installUpdate()
}

const unsubscribeUpdateStatus = electron.onUpdateStatus((status) => {
  updateStatus.value = status
})

void electron.getUpdateStatus().then((status) => {
  updateStatus.value = status
})

onUnmounted(unsubscribeUpdateStatus)
</script>

<style lang="scss" scoped>
.footer {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  .actions {
    display: flex;
    gap: 6px;
    &-item {
      border: 0;
      padding: 0;
      color: inherit;
      background: none;
      font: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      span {
        font-size: 10px;
      }
    }
  }
  .update {
    cursor: pointer;
    user-select: none;
    svg {
      fill: var(--color-green);
      &:hover {
        fill: var(--color-green);
      }
    }
  }
  .update-status {
    user-select: none;
  }
  svg {
    fill: var(--color-gray-500);
    &:hover {
      fill: var(--color-gray-700);
    }
  }
}
</style>
