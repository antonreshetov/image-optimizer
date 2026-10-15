import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseCliArgs } from './cli'
import {
  answersToCommand,
  formatCommandLine,
  getPathSuggestions,
  type CliCommand,
  type WizardAnswers
} from './wizard'

const silent = { stdout: () => {}, stderr: () => {} }

const base = (): CliCommand => {
  const parsed = parseCliArgs([], silent)
  if (parsed.kind !== 'run') throw new Error('Expected defaults')
  return parsed.command
}

const answers = (overrides: Partial<WizardAnswers> = {}): WizardAnswers => ({
  path: 'images',
  outputMode: 'subfolder',
  outputDirectoryName: 'minified',
  webp: false,
  jpegQuality: 75,
  pngQuality: 85,
  keepMetadata: false,
  ...overrides
})

describe('answersToCommand', () => {
  it('maps each output mode to the optimizer options', () => {
    expect(
      answersToCommand(answers({ outputDirectoryName: 'out' }), base())
    ).toMatchObject({
      yes: false,
      options: {
        addToSubfolder: true,
        addMinSuffix: false,
        outputDirectoryName: 'out'
      }
    })
    expect(
      answersToCommand(answers({ outputMode: 'suffix' }), base())
    ).toMatchObject({
      yes: false,
      options: { addToSubfolder: false, addMinSuffix: true }
    })
    expect(
      answersToCommand(answers({ outputMode: 'overwrite' }), base())
    ).toMatchObject({
      yes: true,
      options: { addToSubfolder: false, addMinSuffix: false }
    })
  })

  it('keeps flags the wizard does not ask about', () => {
    const parsed = parseCliArgs(['-c', '3'], silent)
    if (parsed.kind !== 'run') throw new Error('Expected a command')

    expect(
      answersToCommand(answers(), parsed.command).options.concurrency
    ).toBe(3)
  })
})

describe('formatCommandLine', () => {
  it('omits defaults', () => {
    expect(formatCommandLine(answersToCommand(answers(), base()))).toBe(
      'imgopt images'
    )
  })

  it.each([
    answers({ outputDirectoryName: 'out', webp: true, keepMetadata: true }),
    answers({ outputMode: 'suffix', jpegQuality: 60, pngQuality: 40 }),
    answers({ outputMode: 'overwrite', path: "my photos/it's.png" })
  ])('produces arguments that parse back to the same command', (input) => {
    const command = answersToCommand(input, base())
    const line = formatCommandLine(command)
    const argv = [...line.matchAll(/'((?:[^']|'\\'')*)'|(\S+)/g)]
      .slice(1)
      .map((match) => match[1]?.replace(/'\\''/g, "'") ?? match[2]!)

    expect(parseCliArgs(argv, silent)).toEqual({ kind: 'run', command })
  })
})

describe('getPathSuggestions', () => {
  let directory: string

  beforeAll(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'optimizer-wizard-'))
    mkdirSync(path.join(directory, 'images', 'nested'), { recursive: true })
    for (const name of ['photo.jpg', 'notes.txt', '.hidden.png', '.DS_Store'])
      writeFileSync(path.join(directory, 'images', name), '')
  })
  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  const values = (input: string) =>
    getPathSuggestions(directory, input).map((option) => option.value)

  it('starts with the current folder and its contents', () => {
    expect(values('')).toEqual(['.', 'images/'])
  })

  it('lists only folders and supported images inside a folder', () => {
    expect(values('images/').sort()).toEqual(
      ['images/', 'images/nested/', 'images/photo.jpg'].sort()
    )
  })

  it('narrows suggestions by the typed prefix', () => {
    expect(values('images/ph')).toEqual(['images/photo.jpg'])
    expect(values('missing/')).toEqual([])
  })
})
