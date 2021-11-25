<template>
  <div
    class="main"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <AppDragArea
      v-show="isDragAreaShow"
      @hide="isDragAreaShow = false"
    />
    <AppFileList v-show="!isDragAreaShow" />
  </div>
</template>

<script>
import AppDragArea from '@/components/AppDragArea.vue'
import AppFileList from '@/components/AppFileList.vue'

export default {
  name: 'AppMain',

  components: {
    AppDragArea,
    AppFileList
  },

  data () {
    return {
      isDragAreaShow: true,
      showSettings: false
    }
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
    }
  }
}
</script>

<style lang="scss" scoped></style>
