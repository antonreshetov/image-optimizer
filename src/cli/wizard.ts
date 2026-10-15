import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import * as prompts from '@clack/prompts'
import junk from 'junk'
import { DEFAULT_JPEG_QUALITY } from '../main/jpeg-quality'
import type { OptimizerOptions } from '../main/optimizer'
import { DEFAULT_PNG_QUALITY } from '../main/png-quality'
import { isSafeOutputDirectoryName } from '../main/utils'

export const DEFAULT_OUTPUT_DIRECTORY = 'minified'
export const DEFAULT_CONCURRENCY = 10

export interface CliCommand {
  paths: string[]
  options: OptimizerOptions
  json: boolean
  yes: boolean
}

export type OutputMode = 'subfolder' | 'suffix' | 'overwrite'

export interface WizardAnswers {
  path: string
  outputMode: OutputMode
  outputDirectoryName: string
  webp: boolean
  jpegQuality: number
  pngQuality: number
  keepMetadata: boolean
}

export const answersToCommand = (
  answers: WizardAnswers,
  base: CliCommand
): CliCommand => ({
  paths: [answers.path],
  json: false,
  // Choosing "Replace originals" and confirming the summary is consent.
  yes: answers.outputMode === 'overwrite',
  options: {
    ...base.options,
    outputDirectoryName:
      answers.outputMode === 'subfolder'
        ? answers.outputDirectoryName
        : base.options.outputDirectoryName,
    addToSubfolder: answers.outputMode === 'subfolder',
    addMinSuffix: answers.outputMode === 'suffix',
    convertToWebp: answers.webp,
    stripMetadata: !answers.keepMetadata,
    jpegQuality: answers.jpegQuality,
    pngQuality: answers.pngQuality
  }
})

const quoteArg = (value: string) =>
  /^[\w./@%+=:,-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`

// The command a user could rerun to skip the wizard next time.
export const formatCommandLine = (command: CliCommand) => {
  const { options } = command
  const args = [...command.paths]

  if (!options.addToSubfolder) args.push('--in-place')
  else if (options.outputDirectoryName !== DEFAULT_OUTPUT_DIRECTORY)
    args.push('-o', options.outputDirectoryName)
  if (options.addMinSuffix) args.push('-s')
  if (options.convertToWebp) args.push('--webp')
  if (!options.stripMetadata) args.push('--keep-metadata')
  if (options.jpegQuality !== DEFAULT_JPEG_QUALITY)
    args.push('--jpeg-quality', `${options.jpegQuality}`)
  if (options.pngQuality !== DEFAULT_PNG_QUALITY)
    args.push('--png-quality', `${options.pngQuality}`)
  if (options.concurrency !== DEFAULT_CONCURRENCY)
    args.push('-c', `${options.concurrency}`)
  if (command.json) args.push('--json')
  if (command.yes) args.push('--yes')

  return ['imgopt', ...args.map(quoteArg)].join(' ')
}

class WizardCancelled extends Error {}

const answer = async <T>(prompt: Promise<T>) => {
  const value = await prompt
  if (prompts.isCancel(value)) throw new WizardCancelled()
  return value as Exclude<T, symbol>
}

const validateQuality = (value: string | undefined) =>
  /^\d+$/.test(value ?? '') && Number(value) <= 100
    ? undefined
    : 'Enter an integer from 0 to 100'

const askQuality = async (message: string, initial: number) =>
  Number(
    await answer(
      prompts.text({
        message,
        initialValue: `${initial}`,
        validate: validateQuality
      })
    )
  )

const SUPPORTED_IMAGE = /\.(jpe?g|png|gif|svg)$/i

// Relative suggestions limited to folders and supported images; clack's own
// path prompt starts from the absolute cwd and lists every file.
export const getPathSuggestions = (cwd: string, input: string) => {
  const directory =
    input === '' || input.endsWith('/') ? input : path.dirname(input)
  const suggestions: { value: string; label: string; hint?: string }[] = []

  if (input === '') {
    suggestions.push({ value: '.', label: '.', hint: 'this folder' })
  } else if (input.endsWith('/') && existsSync(path.resolve(cwd, input))) {
    suggestions.push({ value: input, label: input, hint: 'this folder' })
  }

  try {
    const entries = readdirSync(path.resolve(cwd, directory || '.'), {
      withFileTypes: true
    })
    for (const entry of entries) {
      const isFolder = entry.isDirectory()
      if (entry.name.startsWith('.') || !junk.not(entry.name)) continue
      if (!isFolder && !SUPPORTED_IMAGE.test(entry.name)) continue

      const value = path.join(directory, entry.name) + (isFolder ? '/' : '')
      if (value.startsWith(input)) suggestions.push({ value, label: value })
    }
  } catch {
    // An unreadable or half-typed path simply has no suggestions.
  }

  return suggestions
}

const getOutputMode = (options: OptimizerOptions): OutputMode => {
  if (options.addToSubfolder) return 'subfolder'
  return options.addMinSuffix ? 'suffix' : 'overwrite'
}

// Flags given alongside a missing path become the wizard's initial answers.
export const runWizard = async (
  base: CliCommand,
  cwd: string
): Promise<CliCommand | null> => {
  const { options } = base

  try {
    const target = await answer(
      prompts.autocomplete<string>({
        message: 'Which file or folder should be optimized?',
        placeholder: 'Type a path, Tab to complete',
        completeOnTab: true,
        maxItems: 8,
        options(this: { userInput: string }) {
          return getPathSuggestions(cwd, this.userInput)
        },
        filter: () => true,
        validate: (value) =>
          typeof value === 'string' && existsSync(path.resolve(cwd, value))
            ? undefined
            : 'Choose an existing file or folder'
      })
    )

    const outputMode = await answer(
      prompts.select<OutputMode>({
        message: 'Where should the optimized files go?',
        initialValue: getOutputMode(options),
        options: [
          {
            value: 'subfolder',
            label: 'Into a subfolder',
            hint: `${DEFAULT_OUTPUT_DIRECTORY}/photo.jpg`
          },
          {
            value: 'suffix',
            label: 'Next to the originals',
            hint: 'photo.min.jpg'
          },
          {
            value: 'overwrite',
            label: 'Replace the originals',
            hint: 'cannot be undone'
          }
        ]
      })
    )

    const outputDirectoryName =
      outputMode === 'subfolder'
        ? await answer(
            prompts.text({
              message: 'Subfolder name',
              initialValue: options.outputDirectoryName,
              validate: (value) =>
                value && isSafeOutputDirectoryName(value)
                  ? undefined
                  : 'Use a plain folder name without slashes'
            })
          )
        : options.outputDirectoryName

    const webp = await answer(
      prompts.confirm({
        message: 'Convert PNG and JPEG to WebP?',
        initialValue: options.convertToWebp
      })
    )

    // cwebp ignores the JPEG and PNG quality settings.
    let { jpegQuality, pngQuality } = options
    if (!webp) {
      const customQuality = await answer(
        prompts.select({
          message: 'Compression quality',
          initialValue: false,
          options: [
            {
              value: false,
              label: 'Recommended',
              hint: `JPEG ${jpegQuality}, PNG ${pngQuality}`
            },
            { value: true, label: 'Custom' }
          ]
        })
      )
      if (customQuality) {
        jpegQuality = await askQuality('JPEG quality (0–100)', jpegQuality)
        pngQuality = await askQuality('PNG quality (0–100)', pngQuality)
      }
    }

    const keepMetadata = await answer(
      prompts.confirm({
        message: 'Keep EXIF and other metadata?',
        initialValue: !options.stripMetadata
      })
    )

    const command = answersToCommand(
      {
        path: path.isAbsolute(target)
          ? path.relative(cwd, target) || '.'
          : target.replace(/(.)\/$/, '$1'),
        outputMode,
        outputDirectoryName,
        webp,
        jpegQuality,
        pngQuality,
        keepMetadata
      },
      base
    )

    prompts.note(formatCommandLine(command), 'Equivalent command')
    const start = await answer(
      prompts.confirm({
        message:
          outputMode === 'overwrite'
            ? 'Replace the original files now?'
            : 'Start optimizing?',
        initialValue: outputMode !== 'overwrite'
      })
    )

    return start ? command : null
  } catch (error) {
    if (error instanceof WizardCancelled) return null
    throw error
  }
}
