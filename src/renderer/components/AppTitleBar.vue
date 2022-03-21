<template>
  <div
    class="tool-bar"
    :class="platform"
  >
    <div class="drag-zone" />
    <div
      class="reduce"
      @click="ipc.send('toolbar', 'reduce')"
    />
    <div
      class="close"
      @click="ipc.send('toolbar', 'close')"
    />
  </div>
</template>

<script setup lang="ts">
import { store as electronStore, ipc } from '@/electron'

const platform = electronStore.get('os')
</script>

<style lang="scss" scoped>
.tool-bar {
    height: var(--toolbar-height);
    display: flex;
    justify-content: right;
    align-items: center;

    .drag-zone {
        width: 100%;
        height: 100%;
        -webkit-app-region: drag;
    }
}

.windows {
    div:not(.drag-zone) {
        position: relative;
        width: 50px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    div:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .reduce::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 38%;
        width: 10px;
        border-bottom: 1px solid var(--color-gray-700);
    }

    .maximize::before {
        content: "";
        position: absolute;
        top: 37%;
        left: 37%;
        width: 8px;
        height: 8px;
        border: 1px solid var(--color-gray-700);
    }

    .close::before, .close::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 32%;
        width: 14px;
        height: 0.5px;
        transform: rotate(45deg);
        background: var(--color-gray-700);
    }

    .close::after {
        transform: rotate(-45deg);
    }

    .close:hover {
        background: rgba(232, 17, 35, 0.8);
    }
}
</style>
