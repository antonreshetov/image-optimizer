<template>
  <div
    ref="dragarea"
    class="app-drag-area"
    @drop="onDrop"
    @dragleave="$emit('hide', true)"
  >
    <div class="hero">
      <AppLogo />
      <h2>Drag files or folder here</h2>
      <p>support only JPG, PNG, GIF and SVG</p>
    </div>
  </div>
</template>

<script>
import AppLogo from '@/components/ui/AppLogo.vue'
import { ipc } from '@/electron'

export default {
  name: 'AppDragArea',

  components: {
    AppLogo
  },

  props: {
    hide: {
      type: Boolean,
      default: false
    }
  },

  emits: ['hide'],

  data () {
    return {}
  },

  methods: {
    onDrop (e) {
      e.preventDefault()
      this.$emit('hide', true)

      const files = Array.from(e.dataTransfer.files).map(f => {
        return {
          name: f.name,
          path: f.path,
          type: f.type
        }
      })

      ipc.send('drop', files, () => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.app-drag-area {
  border: 2px dashed var(--color-gray-300);
  border-radius: 6px;
  height: calc(100% - var(--toolbar-height) - var(--footer-height) - 4px);
  width: calc(100% - 28px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 1000;
  svg {
    fill: var(--color-gray-300);
    width: 150px;
    //   transform: rotate(-90deg);
  }
}
.hero {
  display: flex;
  flex-flow: column;
  align-items: center;
  user-select: none;
  pointer-events: none;
  h2 {
    margin-bottom: 0;
  }
}
</style>
