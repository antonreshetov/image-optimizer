import { describe, expect, it } from 'vitest'
import {
  isAllowedExternalUrl,
  isValidDroppedFiles,
  isValidSettingUpdate
} from './ipc-validation'

describe('IPC validation', () => {
  it('accepts only supported absolute dropped-file paths', () => {
    expect(
      isValidDroppedFiles([
        { name: 'photo.jpg', path: '/tmp/photo.jpg', type: 'image/jpeg' }
      ])
    ).toBe(true)
    expect(
      isValidDroppedFiles([
        { name: 'photo.jpg', path: '../photo.jpg', type: 'image/jpeg' }
      ])
    ).toBe(false)
    expect(
      isValidDroppedFiles([
        { name: 'script.js', path: '/tmp/script.js', type: 'text/javascript' }
      ])
    ).toBe(false)
  })

  it('accepts only whitelisted setting keys and bounded values', () => {
    expect(isValidSettingUpdate({ key: 'mozjpeg.quality', value: 75 })).toBe(
      true
    )
    expect(isValidSettingUpdate({ key: 'bounds', value: {} })).toBe(false)
    expect(isValidSettingUpdate({ key: 'mozjpeg.quality', value: 101 })).toBe(
      false
    )
    expect(isValidSettingUpdate({ key: 'convertToWebp', value: 'yes' })).toBe(
      false
    )
  })

  it('allows only HTTPS URLs within the project GitHub repository', () => {
    expect(
      isAllowedExternalUrl(
        'https://github.com/antonreshetov/image-optimizer/releases'
      )
    ).toBe(true)
    expect(
      isAllowedExternalUrl('https://github.com/antonreshetov/other-project')
    ).toBe(false)
    expect(
      isAllowedExternalUrl(
        'https://github.com.evil.test/antonreshetov/image-optimizer'
      )
    ).toBe(false)
    expect(
      isAllowedExternalUrl(
        'http://github.com/antonreshetov/image-optimizer/releases'
      )
    ).toBe(false)
  })
})
