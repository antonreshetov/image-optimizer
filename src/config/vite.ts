import path from 'path'
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'

const pathSrc = path.resolve(__dirname, '../../../src/renderer')
const pathOut = path.resolve(__dirname, '../renderer')

export default defineConfig({
  root: pathSrc,
  publicDir: 'public',
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: pathOut,
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Непонятно почему но main.js не создается,
        // но при этом решается задача по отключению кодсплиттинга
        manualChunks: () => 'main.js' //
      }
    }
  },
  plugins: [
    vuePlugin(),
    Components({
      dts: `${pathSrc}/types/components.d.ts`,
      dirs: [`${pathSrc}/components`],
      resolvers: [
        IconsResolver({
          prefix: '',
          customCollections: ['svg']
        })
      ]
    }),
    Icons({
      customCollections: {
        svg: FileSystemIconLoader(`${pathSrc}/assets/svg`)
      },
      iconCustomizer (collection, icons, props) {
        if (collection === 'svg') {
          props.width = '20px'
          props.height = '20px'
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': pathSrc
    }
  }
})
