import { describe, expect, it } from 'vitest'
import {
  canDownloadUpdate,
  canInstallUpdate,
  isManagedUpdateSupported
} from './updater-policy'

describe('managed update policy', () => {
  it('only enables packaged macOS and Windows builds', () => {
    expect(isManagedUpdateSupported(true, 'darwin')).toBe(true)
    expect(isManagedUpdateSupported(true, 'win32')).toBe(true)
    expect(isManagedUpdateSupported(true, 'linux')).toBe(false)
    expect(isManagedUpdateSupported(false, 'darwin')).toBe(false)
  })

  it('only downloads an available update', () => {
    expect(canDownloadUpdate('available')).toBe(true)
    expect(canDownloadUpdate('checking')).toBe(false)
    expect(canDownloadUpdate('downloaded')).toBe(false)
  })

  it('only installs a downloaded update', () => {
    expect(canInstallUpdate('downloaded')).toBe(true)
    expect(canInstallUpdate('available')).toBe(false)
    expect(canInstallUpdate('error')).toBe(false)
  })
})
