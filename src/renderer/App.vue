<template>
  <div class="app-tool-bar" />
  <main>
    <RouterView />
  </main>
  <footer>
    <AppFooter />
  </footer>
  <canvas ref="canvas" class="confetti" />
</template>

<script setup lang="ts">
import { useOptimizationState } from '@/composables/useOptimizationState'
import { useSettings } from '@/composables/useSettings'
import type { CreateTypes } from 'canvas-confetti'
import confetti from 'canvas-confetti'
import { electron } from '@/electron'
import { onMounted, onUnmounted, ref } from 'vue'
import router from '@/router'

const { setFileListVisible } = useOptimizationState()
const { settings } = useSettings()
const canvas = ref<HTMLCanvasElement>()
let confettiInstance: CreateTypes

// По какой то причине необходимо явно установить роут в '/'
// для корректного поведения в продакшен сборке
router.push('/')

onMounted(() => {
  confettiInstance = confetti.create(canvas.value!)
})

const runConfetti = () => {
  confettiInstance({
    particleCount: 200,
    origin: { y: 1 }
  })
}

const unsubscribeOptimizationComplete = electron.onOptimizationComplete(() => {
  if (settings.animationOnCompletion) {
    runConfetti()
  }
})
const unsubscribeMenuPreferences = electron.onMenuPreferences(() => {
  router.push('/settings')
})

const unsubscribeDropFromDialog = electron.onDropFromDialog(() => {
  setFileListVisible(true)
})

onUnmounted(() => {
  unsubscribeOptimizationComplete()
  unsubscribeMenuPreferences()
  unsubscribeDropFromDialog()
})
</script>

<style lang="scss">
#app {
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto var(--footer-height);
  grid-template-areas:
    'main'
    'footer';
  main {
    grid-area: main;
    padding: var(--toolbar-height) 12px 0 12px;
  }
  footer {
    grid-area: footer;
    padding: 0 12px;
  }
  .confetti {
    position: absolute;
    height: 100vh;
    width: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
  }
}

.app {
  &-tool-bar {
    position: absolute;
    top: 0;
    width: 100%;
    height: var(--toolbar-height);
    -webkit-app-region: drag;
    z-index: 1010;
    transition: all 0.5s;
  }
}
</style>
