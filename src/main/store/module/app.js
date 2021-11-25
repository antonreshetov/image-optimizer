const Store = require('electron-store')

const app = new Store({
  name: 'app',

  schema: {
    bounds: {
      type: 'object',
      default: null
    },
    addToSubfolder: {
      type: 'boolean',
      default: true
    },
    addMinSuffix: {
      type: 'boolean',
      default: false
    },
    clearResultList: {
      type: 'boolean',
      default: false
    },
    concurrency: {
      type: 'number',
      default: 10
    },
    mozjpeg: {
      type: 'object',
      properties: {
        quality: {
          type: 'number',
          default: 75
        }
      },
      default: {}
    },
    pngquant: {
      type: 'object',
      properties: {
        qualityMin: {
          type: 'number',
          default: 75
        },
        qualityMax: {
          type: 'number',
          default: 85
        }
      },
      default: {}
    }
  }
})

module.exports = app
