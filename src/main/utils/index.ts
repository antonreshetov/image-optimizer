import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import type { DroppedFile, FileSize, OptimizationInput } from '../../shared/ipc'
import junk from 'junk'

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
  return paths.map((p) => {
    const { name, ext } = path.parse(p)
    return {
      name: name + ext,
      path: p,
      type: isFolder(p) ? '' : (mime.lookup(p) as string)
    }
  })
}

const supportedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml'
])

export const expandDroppedFiles = (
  files: DroppedFile[],
  excludedDirectoryName = 'minified',
  excludeGeneratedDirectories = true
): OptimizationInput[] => {
  const result: OptimizationInput[] = []

  const visit = (file: DroppedFile) => {
    if (!fs.existsSync(file.path)) return
    if (isFolder(file.path)) {
      for (const name of fs.readdirSync(file.path).filter(junk.not)) {
        if (
          excludeGeneratedDirectories &&
          (name === excludedDirectoryName || name === 'minified')
        )
          continue
        const filePath = path.join(file.path, name)
        visit({
          name,
          path: filePath,
          type: isFolder(filePath) ? '' : mime.lookup(filePath) || ''
        })
      }
      return
    }

    if (!supportedMimeTypes.has(file.type)) return
    result.push({ ...file, originalSize: getFileSize(file.path) })
  }

  files.forEach(visit)
  return result
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const maximumFractionDigits = i >= 2 ? 1 : 0
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(
    bytes / Math.pow(k, i)
  )} ${sizes[i]}`
}

const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i

export const isSafeOutputDirectoryName = (value: string) => {
  const normalized = value.trim()
  return !(
    value !== normalized ||
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.endsWith('.') ||
    normalized.length > 80 ||
    /[<>:"/\\|?*]/.test(normalized) ||
    Array.from(normalized).some((character) => character.charCodeAt(0) <= 31) ||
    WINDOWS_RESERVED_NAME.test(normalized)
  )
}

export const getSafeOutputDirectoryName = (value: string) =>
  isSafeOutputDirectoryName(value) ? value : 'minified'
