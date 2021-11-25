const path = require('path')
const vuePlugin = require('@vitejs/plugin-vue')
const { defineConfig } = require('vite')

/**
 * https://vitejs.dev/config
 */
const config = defineConfig({
  root: path.resolve(__dirname, '../src/renderer'),
  publicDir: 'public',
  server: {
    port: 8080
  },
  open: false,
  build: {
    outDir: path.resolve(__dirname, '../build/renderer'),
    emptyOutDir: true
  },
  plugins: [vuePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src/renderer')
    }
  }
})

module.exports = config
