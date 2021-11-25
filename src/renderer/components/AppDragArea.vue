<template>
  <div
    ref="dragarea"
    class="app-drag-area"
    @drop="onDrop"
    @dragover="onDragover"
    @dragstart="onDragstart"
    @dragleave="$emit('hide', true)"
  >
    <div class="hero">
      <AppLogo />
      <!-- <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 295.238 295.238"
        style="enable-background:new 0 0 295.238 295.238"
        xml:space="preserve"
        width="100"
      ><path d="M247.619 266.667c-6.2 0-11.438 3.995-13.41 9.524H204.76v-9.524h-4.761v-38.095h9.524v-42.857h-9.524v-47.619h2.943l6.581-13.162v-15.41h-47.619v15.41l6.581 13.162h2.943v47.619l-85.714.005V47.62h109.524c7.876 0 14.286-6.41 14.286-14.286 0-7.876-6.41-14.286-14.286-14.286h-24.733a4.794 4.794 0 0 1-2.976-1.043l-13.376-10.7A33.448 33.448 0 0 0 133.333 0h-47.62c-28.88 0-52.38 23.5-52.38 52.381v128.571c0 28.881 23.5 52.381 52.381 52.381h29.01c3.771 0 7.429-1.105 10.567-3.2l8.633-5.757a3.367 3.367 0 0 1 1.871-.567h21.348c.89 0 1.757.362 2.381.986a12.829 12.829 0 0 0 9.119 3.776h2.786v38.095h-4.762v9.524h-29.448c-1.971-5.529-7.21-9.524-13.41-9.524-7.876 0-14.286 6.41-14.286 14.286 0 7.876 6.41 14.286 14.286 14.286 6.2 0 11.438-3.995 13.41-9.524h29.448v9.524h38.095v-9.524h29.448c1.971 5.529 7.21 9.524 13.41 9.524 7.876 0 14.286-6.41 14.286-14.286 0-7.876-6.412-14.285-14.287-14.285zm-123.81 19.047a4.77 4.77 0 0 1-4.762-4.762c0-2.624 2.138-4.762 4.762-4.762s4.762 2.138 4.762 4.762a4.771 4.771 0 0 1-4.762 4.762zm47.619-163.028v-3.638H200v3.638l-2.943 5.886h-6.581v10.567l-9.524 2.381v-12.948h-6.581l-2.943-5.886zm9.524 42.642v-13.99l9.524-2.381v13.99l-9.524 2.381zm9.524 7.439v12.948h-9.524v-10.567l9.524-2.381zm-21.833 46.282v-.001c-.9 0-1.748-.352-2.381-.986a12.829 12.829 0 0 0-9.119-3.776h-21.348c-2.552 0-5.024.748-7.152 2.167l-8.638 5.757a9.47 9.47 0 0 1-5.281 1.6h-29.01c-23.629 0-42.857-19.229-42.857-42.857V52.381c0-23.629 19.229-42.857 42.857-42.857h47.619a23.895 23.895 0 0 1 14.876 5.219l13.376 10.7a14.316 14.316 0 0 0 8.919 3.129h24.733a4.77 4.77 0 0 1 4.762 4.762 4.77 4.77 0 0 1-4.762 4.762H85.713c-5.252 0-9.524 4.271-9.524 9.524v138.095c0 5.252 4.271 9.524 9.524 9.524h114.286v23.81h-31.356zm12.309 36.755v-13.99l9.524-2.381v13.99l-9.524 2.381zm9.524 7.439v3.424h-9.524v-1.043l9.524-2.381zm-9.524-31.248v-3.424h9.524v1.043l-9.524 2.381zm14.286 53.719H176.19v-9.524h19.048v9.524zm52.381 0a4.77 4.77 0 0 1-4.762-4.762 4.77 4.77 0 0 1 4.762-4.762 4.77 4.77 0 0 1 4.762 4.762 4.771 4.771 0 0 1-4.762 4.762z" /></svg> -->
      <h2>Drag files or folder here</h2>
      <p>support only JPG, PNG and SVG</p>
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
      console.log('onDrop', e)

      console.log(Array.from(e.dataTransfer.files))

      // const files = []
      const files = Array.from(e.dataTransfer.files).map(f => {
        return {
          name: f.name,
          path: f.path,
          type: f.type
        }
      })

      console.log(files)

      // for (const f of e.dataTransfer.files) {
      //   console.log(f)
      //   // files.push({
      //   //   name: f.name,
      //   //   path: f.path
      //   // })
      // }
      ipc.send('drop', files, () => {})
    },
    onDragover (e) {
      // console.log('sds')
      // this.$emit('hide', false)
      e.preventDefault()
      // console.log('onDragOver', e)
    },

    onDragstart (e) {
      console.log('onDragStart', e)
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
