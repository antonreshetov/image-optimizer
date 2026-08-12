import path from 'node:path'
import type { DroppedFile, SettingUpdate } from '../shared/ipc'
import { isSafeOutputDirectoryName } from './utils'

const SUPPORTED_TYPES = new Set([
  '',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/gif'
])

const BOOLEAN_SETTINGS = new Set([
  'addToSubfolder',
  'addMinSuffix',
  'clearResultList',
  'animationOnCompletion',
  'convertToWebp',
  'stripMetadata'
])

const NUMBER_SETTING_RANGES: Record<string, readonly [number, number]> = {
  'mozjpeg.quality': [0, 100],
  pngQuality: [0, 100]
}

export const isValidDroppedFiles = (value: unknown): value is DroppedFile[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10_000) {
    return false
  }

  return value.every((file) => {
    if (!file || typeof file !== 'object') return false
    const candidate = file as Record<string, unknown>
    return (
      typeof candidate.name === 'string' &&
      candidate.name.length > 0 &&
      candidate.name.length <= 1_024 &&
      typeof candidate.path === 'string' &&
      candidate.path.length > 0 &&
      candidate.path.length <= 32_768 &&
      path.isAbsolute(candidate.path) &&
      typeof candidate.type === 'string' &&
      SUPPORTED_TYPES.has(candidate.type)
    )
  })
}

export const isValidSettingUpdate = (
  value: unknown
): value is SettingUpdate => {
  if (!value || typeof value !== 'object') return false
  const update = value as Record<string, unknown>

  if (typeof update.key !== 'string') return false
  if (update.key === 'outputDirectoryName') {
    return (
      typeof update.value === 'string' &&
      isSafeOutputDirectoryName(update.value)
    )
  }
  if (BOOLEAN_SETTINGS.has(update.key)) return typeof update.value === 'boolean'

  const range = NUMBER_SETTING_RANGES[update.key]
  return Boolean(
    range &&
    typeof update.value === 'number' &&
    Number.isInteger(update.value) &&
    update.value >= range[0] &&
    update.value <= range[1]
  )
}

export const isAllowedExternalUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      url.port === '' &&
      url.username === '' &&
      url.password === '' &&
      (url.pathname === '/antonreshetov/image-optimizer' ||
        url.pathname.startsWith('/antonreshetov/image-optimizer/'))
    )
  } catch {
    return false
  }
}
