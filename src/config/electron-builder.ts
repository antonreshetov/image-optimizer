import type { Configuration } from 'electron-builder'
import path from 'path'

export default {
  productName: 'Image Optimizer',
  appId: 'com.antonreshetov.image-optimizer',
  directories: {
    output: path.resolve(__dirname, '../../../dist')
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    shortcutName: 'Image Optimizer'
  },
  mac: {
    target: [
      { target: 'dmg', arch: 'arm64' },
      { target: 'dmg', arch: 'x64' }
    ]
  },
  win: {
    target: 'nsis'
  },
  linux: {
    target: ['snap']
  },
  extraMetadata: {
    main: 'src/main/index.js'
  },
  files: [
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    'package.json',
    {
      from: 'build/src',
      to: 'src',
      filter: ['main/**/*.js', 'renderer/**/*']
    }
  ]
} as Configuration
