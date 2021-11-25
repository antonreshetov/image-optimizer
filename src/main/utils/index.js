const fs = require('fs')

function isFile (path) {
  const stat = fs.lstatSync(path)
  return stat.isFile()
}

function isFolder (path) {
  const stat = fs.lstatSync(path)
  return stat.isDirectory()
}

function getFileSize (path) {
  const stat = fs.lstatSync(path)
  return {
    bytes: stat.size,
    readable: formatBytes(stat.size)
  }
}

function formatBytes (bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

module.exports = {
  isFile,
  isFolder,
  getFileSize
}
