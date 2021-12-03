const axios = require('axios')
const { version } = require('../../package.json')
const isDev = process.env.NODE_ENV === 'development'

async function checkForUpdate (context) {
  if (isDev) return

  const res = await axios.get(
    'https://github.com/antonreshetov/image-optimizer/releases/latest'
  )

  if (res) {
    const latest = res.request.socket._httpMessage.path
      .split('/')
      .pop()
      .substring(1)
    if (latest !== version) {
      context.webContents.send('update-available')
    }
  }
}

module.exports = {
  checkForUpdate
}
