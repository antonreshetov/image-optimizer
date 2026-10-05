import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import mozjpeg from 'mozjpeg'
import pngquant from 'pngquant-bin'
import gifsicle from 'gifsicle'
import cwebp from 'cwebp-bin'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS, type FileOutput } from '../shared/ipc'

const { settings } = vi.hoisted(() => ({
  settings: {
    concurrency: 2,
    addToSubfolder: true,
    outputDirectoryName: 'output',
    addMinSuffix: false,
    convertToWebp: false,
    stripMetadata: true,
    mozjpeg: { quality: 75 },
    pngQuality: 75
  }
}))
vi.mock('./store', () => ({
  store: { app: { get: (key: keyof typeof settings) => settings[key] } }
}))
import { ImageOptimizer } from './image-compressor'

let directory: string
const chunk = (type: string, data: Buffer) => {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, checksum])
}
beforeAll(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'optimizer-integration-'))
  const pixels = Buffer.alloc(32 * 32 * 3)
  for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 17) % 256
  const ppm = path.join(directory, 'input.ppm')
  writeFileSync(ppm, Buffer.concat([Buffer.from('P6\n32 32\n255\n'), pixels]))
  execFileSync(mozjpeg, [
    '-quality',
    '95',
    '-outfile',
    path.join(directory, 'input.jpg'),
    ppm
  ])
  const header = Buffer.alloc(13)
  header.writeUInt32BE(32, 0)
  header.writeUInt32BE(32, 4)
  header[8] = 8
  header[9] = 2
  const rows = Buffer.alloc(32 * (32 * 3 + 1))
  for (let row = 0; row < 32; row++)
    pixels.copy(rows, row * 97 + 1, row * 96, (row + 1) * 96)
  writeFileSync(
    path.join(directory, 'input.png'),
    Buffer.concat([
      Buffer.from('89504e470d0a1a0a', 'hex'),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(rows)),
      chunk('IEND', Buffer.alloc(0))
    ])
  )
  writeFileSync(
    path.join(directory, 'input.gif'),
    Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')
  )
  writeFileSync(
    path.join(directory, 'input.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="red"/></svg>'
  )
})
afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true })
})

const optimize = async (
  extension: string,
  type: string,
  webp: boolean,
  strip: boolean
) => {
  settings.convertToWebp = webp
  settings.stripMetadata = strip
  settings.outputDirectoryName = `${extension}-${webp}-${strip}`
  const input = path.join(directory, `input.${extension}`)
  const original = readFileSync(input)
  const results: FileOutput[] = []
  const errors: unknown[] = []
  await new Promise<void>((resolve) => {
    const context = {
      webContents: {
        send: (channel: string, value: FileOutput) => {
          if (channel === IPC_CHANNELS.fileComplete) results.push(value)
          if (channel === IPC_CHANNELS.fileFailed) errors.push(value)
          if (channel === IPC_CHANNELS.optimizationComplete) resolve()
        }
      }
    } as unknown as BrowserWindow
    new ImageOptimizer(
      [{ path: input, name: `input.${extension}`, type }],
      context
    ).start()
  })
  expect(errors).toEqual([])
  expect(results).toHaveLength(1)
  expect(readFileSync(input)).toEqual(original)
  const output = readFileSync(results[0]!.outputPath)
  expect(output.length).toBeGreaterThan(0)
  expect(results[0]!.compressedSize.bytes).toBe(output.length)
  return output
}

describe('real image optimization', () => {
  it.runIf(process.platform === 'darwin')(
    'ships both Mac architectures for every native compressor',
    () => {
      for (const binary of [mozjpeg, pngquant, gifsicle, cwebp]) {
        const architectures = execFileSync(
          '/usr/bin/lipo',
          ['-archs', binary],
          { encoding: 'utf8' }
        )
        expect(architectures).toContain('arm64')
        expect(architectures).toContain('x86_64')
        const linkage = execFileSync('/usr/bin/otool', ['-L', binary], {
          encoding: 'utf8'
        })
        expect(linkage).not.toMatch(/\/opt\/|\/usr\/local\/|@rpath/)
      }
    }
  )
  it('optimizes JPEG', async () =>
    expect(
      (await optimize('jpg', 'image/jpeg', false, true))
        .subarray(0, 2)
        .toString('hex')
    ).toBe('ffd8'))
  it('optimizes PNG', async () =>
    expect(
      (await optimize('png', 'image/png', false, true))
        .subarray(0, 8)
        .toString('hex')
    ).toBe('89504e470d0a1a0a'))
  it('optimizes GIF', async () =>
    expect(
      (await optimize('gif', 'image/gif', false, true))
        .subarray(0, 3)
        .toString()
    ).toBe('GIF'))
  it('optimizes SVG', async () =>
    expect(
      (await optimize('svg', 'image/svg+xml', false, true)).toString()
    ).toContain('<svg'))
  for (const strip of [false, true]) {
    for (const [extension, type] of [
      ['jpg', 'image/jpeg'],
      ['png', 'image/png']
    ]) {
      it(`converts ${extension} to WebP with stripMetadata=${strip}`, async () => {
        const output = await optimize(extension!, type!, true, strip)
        expect(output.subarray(0, 4).toString()).toBe('RIFF')
        expect(output.subarray(8, 12).toString()).toBe('WEBP')
      })
    }
  }
})
