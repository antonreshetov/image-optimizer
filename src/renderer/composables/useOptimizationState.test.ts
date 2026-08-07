import { describe, expect, it } from 'vitest'
import { useOptimizationState } from './useOptimizationState'

describe('useOptimizationState', () => {
  it('shares state between consumers and resets completed totals', () => {
    const firstConsumer = useOptimizationState()
    const secondConsumer = useOptimizationState()

    firstConsumer.addCompletedFile({
      name: 'sample.jpg',
      path: '/tmp/sample.jpg',
      originalSize: { bytes: 100, readable: '100 Bytes' },
      compressedSize: { bytes: 40, readable: '40 Bytes' },
      compressionPercentage: 60
    })
    firstConsumer.setJobTime('1s')

    expect(secondConsumer.state.files).toHaveLength(1)
    expect(secondConsumer.state.totalFiles.originalSize).toBe(100)
    expect(secondConsumer.state.totalFiles.compressedSize).toBe(40)
    expect(secondConsumer.state.jobTime).toBe('1s')

    secondConsumer.startOptimization(true)

    expect(firstConsumer.state.files).toHaveLength(0)
    expect(firstConsumer.state.totalFiles.originalSize).toBe(0)
    expect(firstConsumer.state.totalFiles.compressedSize).toBe(0)
    expect(firstConsumer.state.jobTime).toBe('-')
  })
})
