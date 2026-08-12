import {
  isFile,
  isFolder,
  getFileSize,
  getSafeOutputDirectoryName
} from './utils'
import {
  ensureDirSync,
  readFile,
  writeFile,
  readdir,
  copyFileSync,
  unlinkSync
} from 'fs-extra'
import { execFile } from 'child_process'
import mozjpeg from 'mozjpeg'
import pngquant from 'pngquant-bin'
import gifsicle from 'gifsicle'
import cwebp from 'cwebp-bin'
import svg from 'svgo'
import junk from 'junk'
import mime from 'mime-types'
import queue from 'queue'
import path from 'path'
import util from 'util'
import { allowPreviewPaths } from './preview-access'
import { store } from '../main/store'
import type { BrowserWindow } from 'electron'
import {
  IPC_CHANNELS,
  type DroppedFile,
  type FileOutput,
  type FileSize
} from '../shared/ipc'
import {
  isGeneratedOutputDirectory,
  runSettledJob
} from './optimization-policy'
import { getPngquantQualityRange } from './png-quality'

const readdirAsync = util.promisify(readdir)

const MIN_SUFFIX = '.min'
const MIME_TYPE_ENUM = {
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  folder: ''
}

export class ImageOptimizer {
  #queue: queue
  #context
  files: DroppedFile[]

  constructor(files: DroppedFile[] = [], context: BrowserWindow) {
    const concurrency = Math.max(1, Math.min(64, store.app.get('concurrency')))
    this.#queue = queue({ results: [], concurrency })
    this.#context = context

    this.files = files
  }

  start() {
    const timeStart = new Date()

    this.#context.webContents.send(IPC_CHANNELS.optimizationStart)
    void this.#startQueue(timeStart)
  }

  async #startQueue(timeStart: Date) {
    try {
      await this.#enqueue(this.files)
    } catch (error) {
      console.error(error)
      this.#finish(timeStart)
      return
    }

    this.#queue.start((error) => {
      if (error) console.error(error)
      this.#finish(timeStart)
    })
  }

  #finish(timeStart: Date) {
    const timeEnd = new Date()
    const timeSpent = `${(timeEnd.valueOf() - timeStart.valueOf()) / 1000}s`

    this.#context.webContents.send(IPC_CHANNELS.optimizationComplete)
    this.#context.webContents.send(IPC_CHANNELS.jobTime, timeSpent)
  }

  async #enqueue(files: DroppedFile[]) {
    for (const file of files) {
      if (!Object.values(MIME_TYPE_ENUM).includes(file.type)) {
        continue
      }

      if (isFile(file.path)) {
        let { name, ext, dir } = path.parse(file.path)
        const outputDirectoryName = getSafeOutputDirectoryName(
          store.app.get('outputDirectoryName')
        )
        const convertToWebp = store.app.get('convertToWebp')
        const availableExtToWebp = ['.png', '.jpg', '.jpeg']

        if (convertToWebp && availableExtToWebp.includes(ext)) {
          ext = '.webp'
        }

        const fileName = store.app.get('addMinSuffix')
          ? `${name}${MIN_SUFFIX}${ext}`
          : `${name}${ext}`

        const outputDirectory = store.app.get('addToSubfolder')
          ? path.join(dir, outputDirectoryName)
          : dir
        const output = path.join(outputDirectory, fileName)
        ensureDirSync(outputDirectory)

        this.#queue.push(() =>
          runSettledJob(
            () => this.#processFile(file, output),
            (error) => {
              console.error(error)
              this.#context.webContents.send(IPC_CHANNELS.fileFailed, {
                path: file.path,
                message:
                  error instanceof Error ? error.message : 'Optimization failed'
              })
            }
          )
        )
      }

      if (isFolder(file.path)) {
        const folderPath = file.path
        const files = (await readdirAsync(file.path)) as string[]
        const _files: DroppedFile[] = []

        files.filter(junk.not).forEach((file) => {
          const filePath = path.join(folderPath, file)
          const directory = isFolder(filePath)
          if (
            directory &&
            isGeneratedOutputDirectory(
              file,
              store.app.get('addToSubfolder'),
              getSafeOutputDirectoryName(store.app.get('outputDirectoryName'))
            )
          ) {
            return
          }
          const type = directory ? '' : mime.lookup(file) || ''

          _files.push({
            name: file,
            path: filePath,
            type
          })
        })

        if (_files.length) {
          await this.#enqueue(_files)
        }
      }
    }
  }

  #processFile = (file: DroppedFile, output: string) => {
    const originalSize = getFileSize(file.path)

    return new Promise<void>((resolve, reject) => {
      const fail = (error: unknown) => {
        console.error(error)
        reject(error)
      }
      const complete = () => {
        try {
          const compressedSize = getFileSize(output)
          allowPreviewPaths(file.path, output)
          this.#sendToRenderer(file, output, originalSize, compressedSize)
          resolve()
        } catch (error) {
          fail(error)
        }
      }
      const toWebp = () => {
        execFile(
          cwebp,
          [
            '-metadata',
            store.app.get('stripMetadata') ? 'none' : 'all',
            file.path,
            '-o',
            output
          ],
          (err: any) => {
            if (err) {
              fail(err)
              return
            }

            complete()
          }
        )
      }

      switch (file.type) {
        case MIME_TYPE_ENUM.jpg: {
          const { quality } = store.app.get('mozjpeg')
          const convertToWebp = store.app.get('convertToWebp')

          let originalFile: string
          const isAddTempFile =
            !convertToWebp &&
            !store.app.get('addToSubfolder') &&
            !store.app.get('addMinSuffix')

          if (isAddTempFile) {
            originalFile = output + '.tmp'
            copyFileSync(file.path, originalFile)
          } else {
            originalFile = file.path
          }

          if (convertToWebp) {
            toWebp()
          } else {
            execFile(
              mozjpeg,
              ['-quality', `${quality}`, '-outfile', output, originalFile],
              (err) => {
                if (isAddTempFile) {
                  try {
                    unlinkSync(originalFile)
                  } catch (error) {
                    fail(error)
                    return
                  }
                }
                if (err) {
                  fail(err)
                  return
                }

                complete()
              }
            )
          }
          break
        }

        case MIME_TYPE_ENUM.png: {
          const quality = store.app.get('pngQuality')
          const convertToWebp = store.app.get('convertToWebp')

          if (convertToWebp) {
            toWebp()
          } else {
            execFile(
              pngquant,
              [
                '--quality',
                getPngquantQualityRange(quality),
                ...(store.app.get('stripMetadata') ? ['--strip'] : []),
                '-fo',
                output,
                file.path
              ],
              (err) => {
                if (err) {
                  fail(err)
                  return
                }

                complete()
              }
            )
          }
          break
        }

        case MIME_TYPE_ENUM.gif: {
          execFile(gifsicle, ['-o', output, file.path], (err) => {
            if (err) {
              fail(err)
              return
            }

            complete()
          })
          break
        }

        case MIME_TYPE_ENUM.svg: {
          readFile(file.path, (err, buffer) => {
            if (err) {
              fail(err)
              return
            }

            const { data } = svg.optimize(buffer.toString())
            writeFile(output, data, (err) => {
              if (err) {
                fail(err)
                return
              }

              complete()
            })
          })
          break
        }
      }
    })
  }

  #formatOutputData(
    file: DroppedFile,
    outputPath: string,
    originalSize: FileSize,
    compressedSize: FileSize
  ): FileOutput {
    return {
      name: file.name,
      path: file.path,
      outputPath,
      originalSize,
      compressedSize,
      compressionPercentage: Number(
        Math.abs(
          compressedSize.bytes * (100 / originalSize.bytes) - 100
        ).toFixed(2)
      )
    }
  }

  #sendToRenderer(
    file: DroppedFile,
    outputPath: string,
    originalSize: FileSize,
    compressedSize: FileSize
  ) {
    this.#context.webContents.send(
      IPC_CHANNELS.fileComplete,
      this.#formatOutputData(file, outputPath, originalSize, compressedSize)
    )
  }
}
