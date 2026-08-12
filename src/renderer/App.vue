<template>
  <div
    class="window-drag-region"
    :class="{
      'window-drag-region--inspector-visible':
        route.path === '/' && state.inspectorVisible
    }"
  >
    <Button
      v-if="route.path === '/'"
      variant="ghost"
      size="icon-sm"
      class="inspector-toggle"
      :title="state.inspectorVisible ? 'Hide inspector' : 'Show inspector'"
      @click="toggleInspector"
    >
      <PanelRight />
    </Button>
  </div>
  <main>
    <RouterView />
  </main>
  <canvas ref="canvas" class="confetti" />
</template>

<script setup lang="ts">
import { useOptimizationState } from '@/composables/useOptimizationState'
import { useSettings } from '@/composables/useSettings'
import type { CreateTypes } from 'canvas-confetti'
import confetti from 'canvas-confetti'
import { electron } from '@/electron'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { PanelRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const { state, addPendingFiles, toggleInspector } = useOptimizationState()
const canvas = ref<HTMLCanvasElement>()
const route = useRoute()
const settingsState = route.path === '/comparison' ? null : useSettings()
let confettiInstance: CreateTypes | undefined

const ensureConfettiCanvas = () => {
  const element = canvas.value
  if (!element) return 1
  const bounds = element.getBoundingClientRect()
  const scale = Math.max(1, window.devicePixelRatio || 1)
  const width = Math.max(1, Math.round(bounds.width * scale))
  const height = Math.max(1, Math.round(bounds.height * scale))

  if (
    !confettiInstance ||
    element.width !== width ||
    element.height !== height
  ) {
    confettiInstance?.reset()
    element.width = width
    element.height = height
    confettiInstance = confetti.create(element, {
      disableForReducedMotion: true
    })
  }

  return scale
}

onMounted(() => {
  ensureConfettiCanvas()
  window.addEventListener('resize', ensureConfettiCanvas)
})

const unsubscribeOptimizationComplete = electron.onOptimizationComplete(() => {
  if (settingsState?.settings.animationOnCompletion) {
    const scale = ensureConfettiCanvas()
    confettiInstance?.({
      particleCount: 160,
      spread: 75,
      origin: { y: 1 },
      startVelocity: 45 * scale,
      gravity: scale,
      scalar: scale
    })
  }
})

const unsubscribeMenuPreferences = electron.onMenuPreferences(() => {
  void router.push('/settings')
})
const unsubscribeMenuToggleInspector =
  electron.onMenuToggleInspector(toggleInspector)
const unsubscribeDropFromDialog = electron.onDropFromDialog(async (files) => {
  addPendingFiles(
    await electron.prepareFiles(files),
    settingsState?.settings.clearResultList
  )
})

onUnmounted(() => {
  window.removeEventListener('resize', ensureConfettiCanvas)
  confettiInstance?.reset()
  unsubscribeOptimizationComplete()
  unsubscribeMenuPreferences()
  unsubscribeMenuToggleInspector()
  unsubscribeDropFromDialog()
})
</script>

<style lang="scss">
#app {
  height: 100vh;
  overflow: hidden;
}

main {
  height: 100%;
}

.window-drag-region {
  -webkit-app-region: drag;
  align-items: center;
  display: flex;
  height: 44px;
  justify-content: flex-start;
  left: 0;
  pointer-events: none;
  padding-left: 108px;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 20;

  &::before {
    background: var(--color-inspector);
    bottom: 0;
    content: '';
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
    transform: translateX(100%);
    transition:
      opacity 160ms ease,
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
    width: 310px;
  }

  &::after {
    background: var(--color-border);
    content: '';
    height: 100vh;
    opacity: 0;
    position: absolute;
    right: 310px;
    top: 0;
    transform: translateX(310px);
    transition:
      opacity 160ms ease,
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
    width: 1px;
  }

  &--inspector-visible::before,
  &--inspector-visible::after {
    opacity: 1;
    transform: translateX(0);
  }

  .inspector-toggle {
    height: 30px;
    pointer-events: auto;
    position: absolute;
    right: 12px;
    top: 7px;
    width: 30px;
  }
}

.confetti {
  height: 100vh;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 100;
}
</style>
