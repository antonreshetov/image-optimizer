<template>
  <div class="app-tool-bar" />
  <main>
    <keep-alive>
      <component :is="component" />
    </keep-alive>
  </main>
  <footer>
    <AppFooter @action="onFooterAction" />
  </footer>
  <canvas
    ref="canvas"
    class="confetti"
  />
</template>

<script>
import AppDragArea from '@/components/AppDragArea.vue'
import AppFileList from '@/components/AppFileList.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppMain from '@/components/AppMain.vue'
import AppSettings from '@/components/AppSettings.vue'
import { ipc, store } from '@/electron'
import confetti from 'canvas-confetti'

export default {
  name: 'App',

  components: {
    AppDragArea,
    AppFileList,
    AppFooter,
    AppMain,
    AppSettings
  },

  provide () {
    return {
      root: this
    }
  },

  data () {
    return {
      component: 'AppMain',
      confetti: null,
      animationOnCompletion: store.get('animationOnCompletion')
    }
  },

  created () {
    ipc.send('message', 'Hello from App.vue!', () => {})
    ipc.on('menu:preferences', () => {
      this.component = 'AppSettings'
    })
    ipc.on('optimization-complete', () => {
      if (this.animationOnCompletion) {
        this.runConfetti()
      }
    })
    store.on('animationOnCompletion', v => {
      this.animationOnCompletion = v
    })
  },

  mounted () {
    this.confetti = confetti.create(this.$refs.canvas)
  },

  methods: {
    onDragOver (e) {
      e.preventDefault()
      this.isDragAreaShow = true
    },
    onDragLeave (e) {
      e.preventDefault()
    },
    onFooterAction (event) {
      if (event === 'settings') {
        this.component = 'AppSettings'
      } else {
        this.component = 'AppMain'
      }
    },
    runConfetti () {
      this.confetti({
        particleCount: 200,
        origin: { y: 1 }
      })
    }
  }
}
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
