function build () {
  const electronBuilder = require('electron-builder')
  const config = require('../config/electron-builder')

  return electronBuilder.build({
    config: config
  })
}

module.exports = build
