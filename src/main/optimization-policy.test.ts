import { describe, expect, it, vi } from 'vitest'
import {
  isGeneratedOutputDirectory,
  runSettledJob
} from './optimization-policy'

describe('optimization policy', () => {
  it('settles a failed job so the remaining queue can continue', async () => {
    const onError = vi.fn()
    const expectedError = new Error('broken image')

    await expect(
      runSettledJob(async () => {
        throw expectedError
      }, onError)
    ).resolves.toBeUndefined()
    expect(onError).toHaveBeenCalledWith(expectedError)
  })

  it('only skips the generated output directory in subfolder mode', () => {
    expect(isGeneratedOutputDirectory('minified', true)).toBe(true)
    expect(isGeneratedOutputDirectory('minified', false)).toBe(false)
    expect(isGeneratedOutputDirectory('photos', true)).toBe(false)
    expect(isGeneratedOutputDirectory('Optimized', true, 'Optimized')).toBe(
      true
    )
  })
})
