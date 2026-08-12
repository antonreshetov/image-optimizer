import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PNG_QUALITY,
  getPngquantQualityRange,
  resolvePngQuality
} from './png-quality'

describe('PNG quality', () => {
  it('uses the current default for a new installation', () => {
    expect(resolvePngQuality(undefined, undefined)).toBe(DEFAULT_PNG_QUALITY)
    expect(DEFAULT_PNG_QUALITY).toBe(75)
  })

  it('migrates the previous maximum when the new setting is absent', () => {
    expect(resolvePngQuality(undefined, 85)).toBe(85)
    expect(resolvePngQuality(70, 85)).toBe(70)
  })

  it('always gives pngquant a zero lower quality boundary', () => {
    expect(getPngquantQualityRange(85)).toBe('0-85')
  })
})
