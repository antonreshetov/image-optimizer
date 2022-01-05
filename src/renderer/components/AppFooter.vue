<template>
  <div class="footer">
    <div class="actions">
      <div
        v-if="updateAvailable"
        class="actions-item update"
        @click="onUpdate"
      >
        <span>Update available</span>
        <SvgArrowCircleUp />
      </div>
      <RouterLink
        v-slot="{navigate}"
        to="/settings"
        custom
      >
        <div
          v-if="showSettingsButton"
          class="actions-item settings"
          @click="navigate"
        >
          <SvgCog />
        </div>
      </RouterLink>
      <RouterLink
        v-slot="{navigate}"
        to="/"
        custom
      >
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
import { ipc } from '@/electron'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const updateAvailable = ref(false)
const showSettingsButton = computed(() => route.path === '/')

const onUpdate = () => {
  ipc.send(
    'open-url',
    'https://github.com/antonreshetov/image-optimizer/releases'
  )
}

ipc.on('update-available', () => {
  updateAvailable.value = true
})
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
  svg {
    fill: var(--color-gray-500);
    &:hover {
      fill: var(--color-gray-700);
    }
  }
}
</style>
