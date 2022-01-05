import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import type { FileSize } from '../types'
import type { DroppedFile } from '../../renderer/types'

export const isFile = (path: string) => {
  const stat = fs.lstatSync(path)
  return stat.isFile()
}

export const isFolder = (path: string) => {
  const stat = fs.lstatSync(path)
  return stat.isDirectory()
}

export const getFileSize = (path: string): FileSize => {
  const stat = fs.lstatSync(path)
  return {
    bytes: stat.size,
    readable: formatBytes(stat.size)
  }
}

export const getFilesOrDirs = (paths: string[]): DroppedFile[] => {
  return paths.map(p => {
    const { name, ext } = path.parse(p)
    return {
      name: name + ext,
      path: p,
      type: isFolder(p) ? '' : mime.lookup(p) as string
    }
  })
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
