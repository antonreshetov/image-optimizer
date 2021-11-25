<template>
  <div class="app-title-bar" />
  <main>
    <keep-alive>
      <component :is="component" />
    </keep-alive>
  </main>
  <footer>
    <AppFooter @action="onFooterAction" />
  </footer>
</template>

<script>
import AppDragArea from '@/components/AppDragArea.vue'
import AppFileList from '@/components/AppFileList.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppMain from '@/components/AppMain.vue'
import AppSettings from '@/components/AppSettings.vue'
import { ipc } from '@/electron'

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
      component: 'AppMain'
    }
  },

  created () {
    ipc.send('message', 'Hello from App.vue!', () => {})
    ipc.on('menu:preferences', () => {
      this.component = 'AppSettings'
    })
  },

  methods: {
    onDragOver (e) {
      e.preventDefault()
      this.isDragAreaShow = true
    },
    onDragLeave (e) {
      e.preventDefault()
      // this.isDragAreaShow = false
      console.log('drag leave')
    },
    onFooterAction (event) {
      console.log(event)
      if (event === 'settings') {
        this.component = 'AppSettings'
      } else {
        this.component = 'AppMain'
      }
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
}

.app {
  &-title-bar {
    position: absolute;
    top: 0;
    width: 100%;
    height: var(--toolbar-height);
    // user-select: none;
    -webkit-app-region: drag;
    z-index: 1010;
    transition: all 0.5s;
  }
}
</style>
