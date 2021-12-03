<template>
  <div class="footer">
    <div class="actions">
      <div
        v-if="updateAvailable"
        class="actions-item update"
        @click="onUpdate"
      >
        <span>Update available</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <path
            d="M12.71,8.29a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-3,3a1,1,0,0,0,1.42,1.42L11,11.41V15a1,1,0,0,0,2,0V11.41l1.29,1.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
          />
        </svg>
      </div>
      <div
        v-if="showSettingsButton"
        class="actions-item settings"
        @click="$emit('action', 'settings')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <path
            d="m21.32 9.55-1.89-.63.89-1.78A1 1 0 0 0 20.13 6L18 3.87a1 1 0 0 0-1.15-.19l-1.78.89-.63-1.89A1 1 0 0 0 13.5 2h-3a1 1 0 0 0-.95.68l-.63 1.89-1.78-.89A1 1 0 0 0 6 3.87L3.87 6a1 1 0 0 0-.19 1.15l.89 1.78-1.89.63a1 1 0 0 0-.68.94v3a1 1 0 0 0 .68.95l1.89.63-.89 1.78A1 1 0 0 0 3.87 18L6 20.13a1 1 0 0 0 1.15.19l1.78-.89.63 1.89a1 1 0 0 0 .95.68h3a1 1 0 0 0 .95-.68l.63-1.89 1.78.89a1 1 0 0 0 1.13-.19L20.13 18a1 1 0 0 0 .19-1.15l-.89-1.78 1.89-.63a1 1 0 0 0 .68-.94v-3a1 1 0 0 0-.68-.95ZM20 12.78l-1.2.4A2 2 0 0 0 17.64 16l.57 1.14-1.1 1.1-1.11-.6a2 2 0 0 0-2.79 1.16l-.4 1.2h-1.59l-.4-1.2A2 2 0 0 0 8 17.64l-1.14.57-1.1-1.1.6-1.11a2 2 0 0 0-1.16-2.82l-1.2-.4v-1.56l1.2-.4A2 2 0 0 0 6.36 8l-.57-1.11 1.1-1.1L8 6.36a2 2 0 0 0 2.82-1.16l.4-1.2h1.56l.4 1.2A2 2 0 0 0 16 6.36l1.14-.57 1.1 1.1-.6 1.11a2 2 0 0 0 1.16 2.79l1.2.4ZM12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z"
          />
        </svg>
      </div>
    </div>
    <div
      v-if="!showSettingsButton"
      class="actions-item settings"
      @click="$emit('action', 'main')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
      >
        <path
          d="m13.41 12 4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42Z"
        />
      </svg>
    </div>
  </div>
</template>

<script>
import { ipc } from '@/electron'

export default {
  name: 'AppFooter',

  inject: ['root'],

  emits: ['action'],

  data () {
    return {
      updateAvailable: false
    }
  },

  computed: {
    showSettingsButton () {
      return this.$root.component === 'AppMain'
    }
  },

  created () {
    ipc.on('update-available', () => {
      this.updateAvailable = true
    })
  },

  methods: {
    onUpdate () {
      ipc.send(
        'open-url',
        'https://github.com/antonreshetov/image-optimizer/releases'
      )
    }
  }
}
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
