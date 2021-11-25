<template>
  <div class="list">
    <div class="list__header">
      <div class="list__header-item">
        <div class="label">
          Original Size:
        </div>
        <h2>{{ total.originalSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Optimized Size:
        </div>
        <h2>{{ total.compressedSize }}</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Compression:
        </div>
        <h2>{{ total.compressionPercentage }} %</h2>
      </div>
      <div class="list__header-item">
        <div class="label">
          Current Job Time:
        </div>
        <h2>{{ jobTime }}</h2>
      </div>
    </div>
    <div class="list__body">
      <table>
        <thead>
          <tr>
            <th width="280">
              Name
            </th>
            <th>Original Size</th>
            <th>Optimized Size</th>
            <th align="right">
              Compression
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(i, index) in files"
            :key="index"
            :class="(index + 1) % 2 === 0 ? 'event' : 'odd'"
          >
            <td>{{ i.name }}</td>
            <td>{{ i.originalSize.readable }}</td>
            <td>{{ i.compressedSize.readable }}</td>
            <td align="right">
              {{ i.compressionPercentage }} %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPreloader v-if="showPreloader" />
  </div>
</template>

<script>
import { ipc, store } from '@/electron'
import AppPreloader from '@/components/ui/AppPreloader.vue'

export default {
  name: 'AppFileList',

  components: {
    AppPreloader
  },

  emits: ['file-list-empty'],

  data () {
    return {
      files: [],
      totalFiles: {
        originalSize: 0,
        compressedSize: 0
      },
      jobTime: '-',
      showPreloader: false
    }
  },

  computed: {
    total () {
      const percentage = Math.abs(
        this.totalFiles.compressedSize * (100 / this.totalFiles.originalSize) -
          100
      ).toFixed(2)
      return {
        originalSize: this.formatBytes(this.totalFiles.originalSize),
        compressedSize: this.formatBytes(this.totalFiles.compressedSize),
        compressionPercentage: isNaN(percentage) ? 0 : percentage
      }
    }
  },

  created () {
    ipc.on('file-complete', (e, file) => {
      this.files.push(file)
      this.totalFiles.originalSize += file.originalSize.bytes
      this.totalFiles.compressedSize += file.compressedSize.bytes
    })
    ipc.on('optimization-start', () => {
      if (store.get('clearResultList')) {
        this.files = []
      }
      this.showPreloader = true
      this.jobTime = '-'
    })
    ipc.on('optimization-complete', () => {
      this.showPreloader = false
      if (this.files.length === 0) {
        this.$emit('file-list-empty')
      }
    })
    ipc.on('job-time', (e, time) => {
      this.jobTime = time
    })
  },

  methods: {
    formatBytes (bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes'

      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }
  }
}
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  font-size: 10px;
  overflow: hidden;
  &__header {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    &-item {
      display: flex;
      flex-flow: column;
      text-align: center;
      h2 {
        margin-top: 0;
      }
    }
  }

  &__body {
    overflow-y: auto;
    height: calc(100vh - var(--footer-height) - 75px);
  }
  table {
    text-align: left;
    width: 100%;
    position: relative;
    border-collapse: collapse;
    thead {
    }
    th {
      background-color: var(--color-bg);
      position: sticky;
      top: 0;
    }
    tr {
      &.event {
        background: var(--color-table-row-even);
      }
    }
  }
}
</style>
