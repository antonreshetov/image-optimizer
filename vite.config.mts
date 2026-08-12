import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const rendererRoot = path.resolve(projectRoot, 'src/renderer')

export default defineConfig({
  root: rendererRoot,
  base: './',
  publicDir: 'public',
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: true
  },
  build: {
    outDir: path.resolve(projectRoot, 'build/renderer'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: () => 'main.js'
      }
    }
  },
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: path.resolve(rendererRoot, 'types/components.d.ts'),
      dirs: [path.resolve(rendererRoot, 'components')],
      resolvers: [
        IconsResolver({
          prefix: '',
          customCollections: ['svg']
        })
      ]
    }),
    Icons({
      customCollections: {
        svg: FileSystemIconLoader(path.resolve(rendererRoot, 'assets/svg'))
      },
      iconCustomizer(collection, _icon, props) {
        if (collection === 'svg') {
          props.width = '20px'
          props.height = '20px'
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': rendererRoot
    }
  }
})
