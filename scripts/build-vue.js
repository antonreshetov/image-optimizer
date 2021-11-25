function build () {
  const vite = require('vite')
  const viteConfig = require('../config/vite')

  return vite.build({
    ...viteConfig,
    base: './',
    mode: 'production'
  })
}

module.exports = build
