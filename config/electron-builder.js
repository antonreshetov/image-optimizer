const path = require('path')

/**
 * https://www.electron.build/configuration/configuration
 */
const config = {
  productName: 'Image Optimizer',
  appId: 'com.antonreshetov.image-optimizer',
  directories: {
    output: path.resolve(__dirname, '../dist')
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    shortcutName: 'Image Optimizer'
  },
  mac: {
    icon: 'build/icons/icon.icns',
    target: [
      { target: 'dmg', arch: 'arm64' },
      { target: 'dmg', arch: 'x64' }
    ]
  },
  win: {
    icon: 'build/icons/icon.ico',
    target: 'nsis'
  },
  linux: {
    target: ['snap']
  },
  files: [
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!src/renderer',
    '!config',
    '!README.md',
    '!scripts',
    '!build',
    '!dist',
    {
      from: 'build/renderer',
      to: 'renderer',
      filter: ['**/*']
    }
  ]
}

module.exports = config
