import { readdir, readFile, writeFile } from 'node:fs/promises'
import { copyFileSync, unlinkSync } from 'node:fs'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { ensureDirSync } from 'fs-extra'
import mozjpeg from 'mozjpeg'
import pngquant from 'pngquant-bin'
import gifsicle from 'gifsicle'
import cwebp from 'cwebp-bin'
import svg from 'svgo'
import junk from 'junk'
import mime from 'mime-types'
import queue from 'queue'
import {
  isFile,
  isFolder,
  getFileSize,
  getSafeOutputDirectoryName
} from './utils'
import type {
  DroppedFile,
  FileFailure,
  FileOutput,
  FileSize
} from '../shared/ipc'
import {
  isGeneratedOutputDirectory,
  runSettledJob
} from './optimization-policy'
import { getPngquantQualityRange } from './png-quality'

// Kept free of Electron APIs so the CLI can run it under ELECTRON_RUN_AS_NODE.

const MIN_SUFFIX = '.min'
const MIME_TYPE_ENUM = {
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  folder: ''
}

export interface OptimizerOptions {
  concurrency: number
  outputDirectoryName: string
  addToSubfolder: boolean
  addMinSuffix: boolean
  convertToWebp: boolean
  stripMetadata: boolean
  jpegQuality: number
  pngQuality: number
}

export interface OptimizerEvents {
  onFileComplete?: (file: FileOutput) => void
  onFileFailed?: (failure: FileFailure, error: unknown) => void
}

const run = (file: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    execFile(file, args, (error) => (error ? reject(error) : resolve()))
  })

const formatOutputData = (
  file: DroppedFile,
  outputPath: string,
  originalSize: FileSize,
  compressedSize: FileSize
): FileOutput => ({
  name: file.name,
  path: file.path,
  outputPath,
  originalSize,
  compressedSize,
  compressionPercentage: Number(
    Math.abs(compressedSize.bytes * (100 / originalSize.bytes) - 100).toFixed(2)
  )
})

const compress = async (
  file: DroppedFile,
  output: string,
  options: OptimizerOptions
) => {
  const toWebp = () =>
    run(cwebp, [
      '-metadata',
      options.stripMetadata ? 'none' : 'all',
      file.path,
      '-o',
      output
    ])

  switch (file.type) {
    case MIME_TYPE_ENUM.jpg: {
      if (options.convertToWebp) return toWebp()

      // mozjpeg cannot read and write the same file, so overwriting the
      // original in place goes through a temporary copy.
      const isAddTempFile = !options.addToSubfolder && !options.addMinSuffix
      const input = isAddTempFile ? output + '.tmp' : file.path
      if (isAddTempFile) copyFileSync(file.path, input)

      try {
        await run(mozjpeg, [
          '-quality',
          `${options.jpegQuality}`,
          '-outfile',
          output,
          input
        ])
      } finally {
        if (isAddTempFile) unlinkSync(input)
      }
      return
    }

    case MIME_TYPE_ENUM.png: {
      if (options.convertToWebp) return toWebp()

      return run(pngquant, [
        '--quality',
        getPngquantQualityRange(options.pngQuality),
        ...(options.stripMetadata ? ['--strip'] : []),
        '-fo',
        output,
        file.path
      ])
    }

    case MIME_TYPE_ENUM.gif:
      return run(gifsicle, ['-o', output, file.path])

    case MIME_TYPE_ENUM.svg: {
      const buffer = await readFile(file.path)
      const { data } = svg.optimize(buffer.toString())
      await writeFile(output, data)
      return
    }
  }
}

const getOutputPath = (filePath: string, options: OptimizerOptions) => {
  let { name, ext, dir } = path.parse(filePath)
  const availableExtToWebp = ['.png', '.jpg', '.jpeg']

  if (options.convertToWebp && availableExtToWebp.includes(ext)) {
    ext = '.webp'
  }

  const fileName = options.addMinSuffix
    ? `${name}${MIN_SUFFIX}${ext}`
    : `${name}${ext}`
  const outputDirectory = options.addToSubfolder
    ? path.join(dir, getSafeOutputDirectoryName(options.outputDirectoryName))
    : dir

  return { outputDirectory, output: path.join(outputDirectory, fileName) }
}

export const optimizeImages = async (
  files: DroppedFile[],
  options: OptimizerOptions,
  events: OptimizerEvents = {}
) => {
  const concurrency = Math.max(1, Math.min(64, options.concurrency))
  const jobs = queue({ results: [], concurrency })
  const outputDirectoryName = getSafeOutputDirectoryName(
    options.outputDirectoryName
  )

  const processFile = async (file: DroppedFile, output: string) => {
    const originalSize = getFileSize(file.path)
    await compress(file, output, options)
    events.onFileComplete?.(
      formatOutputData(file, output, originalSize, getFileSize(output))
    )
  }

  const enqueue = async (files: DroppedFile[]) => {
    for (const file of files) {
      if (!Object.values(MIME_TYPE_ENUM).includes(file.type)) {
        continue
      }

      if (isFile(file.path)) {
        const { outputDirectory, output } = getOutputPath(file.path, options)
        ensureDirSync(outputDirectory)

        jobs.push(() =>
          runSettledJob(
            () => processFile(file, output),
            (error) => {
              events.onFileFailed?.(
                {
                  path: file.path,
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Optimization failed'
                },
                error
              )
            }
          )
        )
      }

      if (isFolder(file.path)) {
        const folderPath = file.path
        const names = await readdir(folderPath)
        const children: DroppedFile[] = []

        names.filter(junk.not).forEach((name) => {
          const filePath = path.join(folderPath, name)
          const directory = isFolder(filePath)
          if (
            directory &&
            isGeneratedOutputDirectory(
              name,
              options.addToSubfolder,
              outputDirectoryName
            )
          ) {
            return
          }

          children.push({
            name,
            path: filePath,
            type: directory ? '' : mime.lookup(name) || ''
          })
        })

        if (children.length) {
          await enqueue(children)
        }
      }
    }
  }

  await enqueue(files)
  await new Promise<void>((resolve, reject) => {
    jobs.start((error) => (error ? reject(error) : resolve()))
  })
}
