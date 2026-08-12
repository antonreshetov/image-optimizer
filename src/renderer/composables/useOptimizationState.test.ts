import { describe, expect, it } from 'vitest'
import { useOptimizationState } from './useOptimizationState'

describe('useOptimizationState', () => {
  it('stores pending jobs and applies completed output', () => {
    const first = useOptimizationState()
    const second = useOptimizationState()
    first.clearResults()
    first.addPendingFiles([
      {
        name: 'sample.jpg',
        path: '/tmp/sample.jpg',
        type: 'image/jpeg',
        originalSize: { bytes: 100, readable: '100 Bytes' }
      }
    ])

    expect(second.state.files[0]?.status).toBe('pending')
    first.startOptimization()
    expect(second.state.files[0]?.status).toBe('running')

    first.addCompletedFile({
      name: 'sample.jpg',
      path: '/tmp/sample.jpg',
      outputPath: '/tmp/minified/sample.jpg',
      originalSize: { bytes: 100, readable: '100 Bytes' },
      compressedSize: { bytes: 40, readable: '40 Bytes' },
      compressionPercentage: 60
    })

    expect(second.state.files[0]?.status).toBe('completed')
    expect(second.state.totalFiles.originalSize).toBe(100)
    expect(second.state.totalFiles.compressedSize).toBe(40)
  })

  it('marks unfinished jobs as failed when a run ends', () => {
    const optimization = useOptimizationState()
    optimization.clearResults()
    optimization.addPendingFiles([
      {
        name: 'missing.jpg',
        path: '/tmp/missing.jpg',
        type: 'image/jpeg',
        originalSize: { bytes: 100, readable: '100 Bytes' }
      }
    ])

    optimization.startOptimization()
    optimization.finishOptimization()

    expect(optimization.state.files[0]?.status).toBe('failed')
    expect(optimization.state.files[0]?.error).toBe(
      'Optimization did not finish'
    )
  })

  it('clears completed and failed results before a new import', () => {
    const optimization = useOptimizationState()
    optimization.clearResults()
    optimization.addPendingFiles([
      {
        name: 'failed.jpg',
        path: '/tmp/failed.jpg',
        type: 'image/jpeg',
        originalSize: { bytes: 100, readable: '100 Bytes' }
      }
    ])
    optimization.failFile({
      path: '/tmp/failed.jpg',
      message: 'Broken image'
    })

    optimization.addPendingFiles(
      [
        {
          name: 'fresh.jpg',
          path: '/tmp/fresh.jpg',
          type: 'image/jpeg',
          originalSize: { bytes: 80, readable: '80 Bytes' }
        }
      ],
      true
    )

    expect(optimization.state.files.map((file) => file.path)).toEqual([
      '/tmp/fresh.jpg'
    ])
    expect(optimization.state.selectedPath).toBe('/tmp/fresh.jpg')
  })
})
