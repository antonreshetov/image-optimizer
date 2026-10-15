import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DEFAULT_JPEG_QUALITY } from '../main/jpeg-quality'
import { DEFAULT_PNG_QUALITY } from '../main/png-quality'
import {
  EXIT_FAILED_FILES,
  EXIT_OK,
  EXIT_USAGE,
  parseCliArgs,
  runCli
} from './cli'

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">  <!-- comment -->  <rect width="32" height="32" fill="#ff0000"/></svg>'

const silent = { stdout: () => {}, stderr: () => {} }

describe('parseCliArgs', () => {
  it('uses the app defaults', () => {
    expect(parseCliArgs(['images'], silent)).toEqual({
      kind: 'run',
      command: {
        paths: ['images'],
        json: false,
        yes: false,
        options: {
          concurrency: 10,
          outputDirectoryName: 'minified',
          addToSubfolder: true,
          addMinSuffix: false,
          convertToWebp: false,
          stripMetadata: true,
          jpegQuality: DEFAULT_JPEG_QUALITY,
          pngQuality: DEFAULT_PNG_QUALITY
        }
      }
    })
  })

  it('maps flags to optimizer options', () => {
    const parsed = parseCliArgs(
      [
        '--in-place',
        '-s',
        '--webp',
        '--keep-metadata',
        '--jpeg-quality',
        '60',
        '--png-quality=40',
        '-c',
        '4',
        '--json',
        '-y',
        'a.png',
        'b'
      ],
      silent
    )
    expect(parsed).toMatchObject({
      kind: 'run',
      command: {
        paths: ['a.png', 'b'],
        json: true,
        yes: true,
        options: {
          concurrency: 4,
          addToSubfolder: false,
          addMinSuffix: true,
          convertToWebp: true,
          stripMetadata: false,
          jpegQuality: 60,
          pngQuality: 40
        }
      }
    })
  })

  it.each([
    [['--png-quality', '101', 'a.png']],
    [['--jpeg-quality', '7.5', 'a.jpg']],
    [['--concurrency', '0', 'a.jpg']],
    [['--output-dir', '../up', 'a.jpg']],
    [['--in-place', '-o', 'out', 'a.jpg']],
    [['--unknown', 'a.jpg']]
  ])('rejects invalid input %j', (argv) => {
    let stderr = ''
    const parsed = parseCliArgs(argv, {
      stdout: () => {},
      stderr: (text) => {
        stderr += text
      }
    })
    expect(parsed).toEqual({ kind: 'exit', code: EXIT_USAGE })
    expect(stderr).toContain('error:')
  })

  it.each([['--help'], ['-v']])('exits cleanly for %s', (flag) => {
    let stdout = ''
    const parsed = parseCliArgs([flag], {
      stdout: (text) => {
        stdout += text
      },
      stderr: () => {}
    })
    expect(parsed).toEqual({ kind: 'exit', code: EXIT_OK })
    expect(stdout).not.toBe('')
  })
})

describe('runCli', () => {
  let directory: string
  let stdout: string
  let stderr: string
  const io = () => ({
    stdout: (text: string) => {
      stdout += text
    },
    stderr: (text: string) => {
      stderr += text
    },
    cwd: directory,
    interactive: false
  })

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'optimizer-cli-'))
    stdout = ''
    stderr = ''
  })
  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('requires paths when it cannot ask questions', async () => {
    expect(await runCli([], io())).toBe(EXIT_USAGE)
    expect(stderr).toContain("missing required argument 'paths'")
    expect(await runCli(['--json'], { ...io(), interactive: true })).toBe(
      EXIT_USAGE
    )
  })

  it('returns a usage error for missing paths', async () => {
    expect(await runCli(['missing.svg'], io())).toBe(EXIT_USAGE)
    expect(stderr).toContain('not found')
  })

  it('optimizes a folder into the output subfolder', async () => {
    mkdirSync(path.join(directory, 'icons'))
    writeFileSync(path.join(directory, 'icons', 'logo.svg'), SVG)

    expect(await runCli(['icons', '-o', 'out'], io())).toBe(EXIT_OK)

    const output = path.join(directory, 'icons', 'out', 'logo.svg')
    expect(readFileSync(output, 'utf8')).not.toContain('comment')
    expect(stdout).toContain(path.join('icons', 'out', 'logo.svg'))
    expect(stdout).toContain('Optimized 1 file(s)')
  })

  it('prints JSON and reports failures with a non-zero exit code', async () => {
    writeFileSync(path.join(directory, 'good.svg'), SVG)
    writeFileSync(path.join(directory, 'bad.svg'), '<svg><g></svg>')

    const code = await runCli(['--json', '--in-place', '-s', '.'], io())

    expect(code).toBe(EXIT_FAILED_FILES)
    const report = JSON.parse(stdout)
    expect(report.files).toHaveLength(1)
    expect(report.failures).toEqual([
      expect.objectContaining({ path: path.join(directory, 'bad.svg') })
    ])
    expect(existsSync(path.join(directory, 'good.min.svg'))).toBe(true)
  })

  it('refuses to overwrite originals without --yes when not interactive', async () => {
    const original = path.join(directory, 'logo.svg')
    writeFileSync(original, SVG)

    expect(await runCli(['--in-place', '.'], io())).toBe(EXIT_USAGE)
    expect(stderr).toContain('overwrite 1 original file(s)')
    expect(readFileSync(original, 'utf8')).toBe(SVG)

    expect(await runCli(['--in-place', '--yes', '.'], io())).toBe(EXIT_OK)
    expect(readFileSync(original, 'utf8')).not.toContain('comment')
  })

  it('does not count JPEG and PNG as overwritten when converting to WebP', async () => {
    writeFileSync(path.join(directory, 'photo.png'), 'not really a png')

    expect(await runCli(['--in-place', '--webp', '--json', '.'], io())).toBe(
      EXIT_FAILED_FILES
    )
    expect(stderr).not.toContain('overwrite')
  })
})
