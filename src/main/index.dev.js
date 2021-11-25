require('electron').app.on('ready', () => {
  const installExtension = require('electron-devtools-installer')
  installExtension
    .default(installExtension.VUEJS3_DEVTOOLS, {
      loadExtensionOptions: {
        allowFileAccess: true
      }
    })
    .then(() => {})
    .catch(err => {
      console.log('Fail to install `vue devtools`', err)
    })
})

require('.')
