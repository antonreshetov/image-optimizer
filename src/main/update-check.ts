import axios from 'axios'
import type { BrowserWindow } from 'electron'
import { version } from '../../package.json'
const isDev = process.env.NODE_ENV === 'development'

export async function checkForUpdate (context: BrowserWindow) {
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
