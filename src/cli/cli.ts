import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  Command,
  CommanderError,
  InvalidArgumentError,
  Option
} from 'commander'
import * as prompts from '@clack/prompts'
import { version } from '../../package.json'
import { DEFAULT_JPEG_QUALITY } from '../main/jpeg-quality'
import { optimizeImages, type OptimizerOptions } from '../main/optimizer'
import { DEFAULT_PNG_QUALITY } from '../main/png-quality'
import {
  expandDroppedFiles,
  formatBytes,
  getFilesOrDirs,
  isSafeOutputDirectoryName
} from '../main/utils'
import type { FileFailure, FileOutput, OptimizationInput } from '../shared/ipc'
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_OUTPUT_DIRECTORY,
  runWizard,
  type CliCommand
} from './wizard'

export const EXIT_OK = 0
export const EXIT_FAILED_FILES = 1
export const EXIT_USAGE = 2
export const EXIT_CANCELLED = 130

const WEBP_SOURCE_TYPES = new Set(['image/jpeg', 'image/png'])

export interface CliIo {
  stdout: (text: string) => void
  stderr: (text: string) => void
  cwd: string
  // Prompts and the progress bar would hang or garble output in pipes and CI,
  // so they are used only when a person is at the terminal.
  interactive: boolean
}

export type ParsedCli =
  { kind: 'run'; command: CliCommand } | { kind: 'exit'; code: number }

interface CliFlags {
  outputDir: string
  inPlace?: boolean
  suffix?: boolean
  webp?: boolean
  keepMetadata?: boolean
  jpegQuality: number
  pngQuality: number
  concurrency: number
  json?: boolean
  yes?: boolean
}

const integerInRange = (min: number, max: number) => (value: string) => {
  const number = Number(value)
  if (!/^\d+$/.test(value) || number < min || number > max) {
    throw new InvalidArgumentError(`Must be an integer from ${min} to ${max}.`)
  }
  return number
}

const outputDirectoryName = (value: string) => {
  if (!isSafeOutputDirectoryName(value)) {
    throw new InvalidArgumentError('Must be a plain folder name.')
  }
  return value
}

const createProgram = (io: Pick<CliIo, 'stdout' | 'stderr'>) =>
  new Command('image-optimizer')
    .description(
      'Optimize JPEG, PNG, GIF and SVG files. Folders are processed recursively.'
    )
    .version(version, '-v, --version')
    .argument(
      '[paths...]',
      'files or folders to optimize; omit to answer questions instead'
    )
    .addOption(
      new Option('-o, --output-dir <name>', 'subfolder for optimized files')
        .default(DEFAULT_OUTPUT_DIRECTORY)
        .argParser(outputDirectoryName)
    )
    .addOption(
      new Option(
        '--in-place',
        'write next to the originals; without --suffix this overwrites them'
      ).conflicts('outputDir')
    )
    .option('-s, --suffix', 'add the .min suffix to file names')
    .option('--webp', 'convert PNG and JPEG to WebP')
    .option('--keep-metadata', 'keep EXIF and other metadata')
    .addOption(
      new Option('--jpeg-quality <0-100>', 'JPEG quality')
        .default(DEFAULT_JPEG_QUALITY)
        .argParser(integerInRange(0, 100))
    )
    .addOption(
      new Option('--png-quality <0-100>', 'PNG quality')
        .default(DEFAULT_PNG_QUALITY)
        .argParser(integerInRange(0, 100))
    )
    .addOption(
      new Option('-c, --concurrency <1-64>', 'files processed in parallel')
        .default(DEFAULT_CONCURRENCY)
        .argParser(integerInRange(1, 64))
    )
    .option('--json', 'print the results as JSON')
    .option('-y, --yes', 'overwrite originals without asking')
    .showHelpAfterError('(run image-optimizer --help for usage)')
    .configureOutput({ writeOut: io.stdout, writeErr: io.stderr })
    .exitOverride()

export const parseCliArgs = (
  argv: string[],
  io: Pick<CliIo, 'stdout' | 'stderr'>
): ParsedCli => {
  const program = createProgram(io)
  try {
    program.parse(argv, { from: 'user' })
  } catch (error) {
    // --help and --version also end up here, with exit code 0.
    if (error instanceof CommanderError) {
      return { kind: 'exit', code: error.exitCode ? EXIT_USAGE : EXIT_OK }
    }
    throw error
  }

  const flags = program.opts<CliFlags>()
  return {
    kind: 'run',
    command: {
      paths: program.args,
      json: Boolean(flags.json),
      yes: Boolean(flags.yes),
      options: {
        concurrency: flags.concurrency,
        outputDirectoryName: flags.outputDir,
        addToSubfolder: !flags.inPlace,
        addMinSuffix: Boolean(flags.suffix),
        convertToWebp: Boolean(flags.webp),
        stripMetadata: !flags.keepMetadata,
        jpegQuality: flags.jpegQuality,
        pngQuality: flags.pngQuality
      }
    }
  }
}

const countOverwrittenOriginals = (
  inputs: OptimizationInput[],
  options: OptimizerOptions
) => {
  if (options.addToSubfolder || options.addMinSuffix) return 0
  return inputs.filter(
    (input) => !(options.convertToWebp && WEBP_SOURCE_TYPES.has(input.type))
  ).length
}

const formatResult = (file: FileOutput, cwd: string) => {
  const saved = file.originalSize.bytes - file.compressedSize.bytes
  const change =
    saved >= 0
      ? `-${file.compressionPercentage}%`
      : `+${file.compressionPercentage}%`
  return `${path.relative(cwd, file.outputPath)}  ${file.originalSize.readable} → ${file.compressedSize.readable} (${change})`
}

const formatFailure = (failure: FileFailure, cwd: string) =>
  `${path.relative(cwd, failure.path)}: ${failure.message}`

const formatSummary = (
  results: FileOutput[],
  failures: FileFailure[],
  seconds: number
) => {
  const originalBytes = results.reduce((s, f) => s + f.originalSize.bytes, 0)
  const compressedBytes = results.reduce(
    (s, f) => s + f.compressedSize.bytes,
    0
  )
  const saved = originalBytes - compressedBytes
  const percentage = originalBytes
    ? ((saved / originalBytes) * 100).toFixed(1)
    : '0'
  return (
    `Optimized ${results.length} file(s)` +
    (failures.length ? `, ${failures.length} failed` : '') +
    `, saved ${formatBytes(Math.max(0, saved))} (${percentage}%) in ${seconds}s`
  )
}

export const runCli = async (argv: string[], io: CliIo) => {
  const parsed = parseCliArgs(argv, io)
  if (parsed.kind === 'exit') return parsed.code

  let command = parsed.command
  const interactive = io.interactive && !command.json

  if (!command.paths.length) {
    if (!interactive) {
      io.stderr(
        "error: missing required argument 'paths'\n(run image-optimizer --help for usage)\n"
      )
      return EXIT_USAGE
    }
    prompts.intro('image-optimizer')
    const answered = await runWizard(command, io.cwd)
    if (!answered) {
      prompts.cancel('Nothing was changed.')
      return EXIT_CANCELLED
    }
    command = answered
  } else if (interactive) {
    prompts.intro('image-optimizer')
  }

  const { options, json, yes } = command
  const paths = command.paths.map((p) => path.resolve(io.cwd, p))
  const missing = paths.filter((p) => !existsSync(p))
  if (missing.length) {
    for (const p of missing) io.stderr(`image-optimizer: not found: ${p}\n`)
    return EXIT_USAGE
  }

  const files = getFilesOrDirs(paths)
  const inputs = expandDroppedFiles(
    files,
    options.outputDirectoryName,
    options.addToSubfolder
  )

  const overwritten = countOverwrittenOriginals(inputs, options)
  if (overwritten && !yes) {
    if (!interactive) {
      io.stderr(
        `image-optimizer: this would overwrite ${overwritten} original file(s); pass --yes to confirm\n`
      )
      return EXIT_USAGE
    }
    const confirmed = await prompts.confirm({
      message: `Overwrite ${overwritten} original file(s)?`,
      initialValue: false
    })
    if (prompts.isCancel(confirmed) || !confirmed) {
      prompts.cancel('Nothing was changed.')
      return EXIT_CANCELLED
    }
  }

  const results: FileOutput[] = []
  const failures: FileFailure[] = []
  const timeStart = Date.now()
  const bar =
    interactive && inputs.length
      ? prompts.progress({ max: inputs.length })
      : null

  bar?.start(`Optimizing ${inputs.length} file(s)`)
  try {
    await optimizeImages(files, options, {
      onFileComplete: (file) => {
        results.push(file)
        bar?.advance(1, path.relative(io.cwd, file.path))
        if (!interactive && !json) {
          io.stdout(`✓ ${formatResult(file, io.cwd)}\n`)
        }
      },
      onFileFailed: (failure) => {
        failures.push(failure)
        bar?.advance(1, path.relative(io.cwd, failure.path))
        if (!interactive && !json) {
          io.stderr(`✗ ${formatFailure(failure, io.cwd)}\n`)
        }
      }
    })
  } catch (error) {
    bar?.error('Optimization stopped')
    throw error
  }
  const seconds = (Date.now() - timeStart) / 1000
  bar?.stop(`Processed ${inputs.length} file(s)`)

  if (json) {
    io.stdout(
      `${JSON.stringify(
        {
          files: results,
          failures,
          originalBytes: results.reduce((s, f) => s + f.originalSize.bytes, 0),
          compressedBytes: results.reduce(
            (s, f) => s + f.compressedSize.bytes,
            0
          ),
          seconds
        },
        null,
        2
      )}\n`
    )
  } else if (!results.length && !failures.length) {
    if (interactive) prompts.outro('No supported images found')
    else io.stderr('No supported images found\n')
  } else if (interactive) {
    if (results.length) {
      prompts.log.success(
        results.map((file) => formatResult(file, io.cwd)).join('\n')
      )
    }
    for (const failure of failures) {
      prompts.log.error(formatFailure(failure, io.cwd))
    }
    prompts.outro(formatSummary(results, failures, seconds))
  } else {
    io.stdout(`\n${formatSummary(results, failures, seconds)}\n`)
  }

  return failures.length ? EXIT_FAILED_FILES : EXIT_OK
}
