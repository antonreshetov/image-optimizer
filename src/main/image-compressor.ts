import { isFile, isFolder, getFileSize } from './utils'
import { ensureDirSync, readFile, writeFile, readdir } from 'fs-extra'
import { execFile } from 'child_process'
import mozjpeg from 'mozjpeg'
import pngquant from 'pngquant-bin'
import gifsicle from 'gifsicle'
import svg from 'svgo'
import junk from 'junk'
import mime from 'mime-types'
import queue from 'queue'
import path from 'path'
import util from 'util'
import { store } from '../main/store'
import type { BrowserWindow } from 'electron'
import type { DroppedFile } from '../renderer/types'
import type { FileOutput, FileSize } from './types'

const readdirAsync = util.promisify(readdir)

const MIN_FOLDER = 'minified'
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

  constructor (files: DroppedFile[] = [], context: BrowserWindow) {
    this.#queue = queue({ results: [], concurrency: 10 })
    this.#context = context

    this.files = files
  }

  start () {
    const timeStart = new Date()

    this.#context.webContents.send('optimization-start')

    this.#optimize(this.files)
    this.#queue.on('end', () => {
      const timeEnd = new Date()
      const timeSpent = `${(timeEnd.valueOf() - timeStart.valueOf()) / 1000}s`

      this.#context.webContents.send('optimization-complete')
      this.#context.webContents.send('job-time', timeSpent)
    })
  }

  #optimize (files: DroppedFile[]) {
    files.forEach(async file => {
      if (!Object.values(MIME_TYPE_ENUM).includes(file.type)) {
        return
      }

      if (isFile(file.path)) {
        const { name, ext, dir } = path.parse(file.path)
        const isAddToSubfolder = store.app.get('addToSubfolder')

        const fileName = store.app.get('addMinSuffix')
          ? `${name}${MIN_SUFFIX}${ext}`
          : `${name}${ext}`

        const output = isAddToSubfolder
          ? `${dir}/${MIN_FOLDER}/${fileName}`
          : `${dir}/${fileName}`

        if (isAddToSubfolder) {
          ensureDirSync(`${dir}/${MIN_FOLDER}`)
        }

        this.#queue.push(() => this.#processFile(file, output))
      }

      if (isFolder(file.path)) {
        const folderPath = file.path
        const files = await readdirAsync(file.path) as string[]
        const _files: DroppedFile[] = []

        files.filter(junk.not).forEach(file => {
          if (isFolder(`${folderPath}/${file}`)) return

          _files.push({
            name: file,
            path: `${folderPath}/${file}`,
            type: mime.lookup(file) as string
          })
        })

        if (_files.length) {
          this.#optimize(_files)
        }
      }
    })

    this.#queue.start()
  }

  #processFile = (file: DroppedFile, output: string) => {
    const originalSize = getFileSize(file.path)

    return new Promise<void>((resolve, reject) => {
      switch (file.type) {
        case MIME_TYPE_ENUM.jpg: {
          const { quality } = store.app.get('mozjpeg')

          execFile(
            mozjpeg,
            ['-quality', `${quality}`, '-outfile', output, file.path],
            err => {
              if (err) {
                console.log(err)
                reject(err)
              }

              const compressedSize = getFileSize(output)
              this.#sendToRenderer(file, originalSize, compressedSize)
              resolve()
            }
          )
          break
        }

        case MIME_TYPE_ENUM.png: {
          const { qualityMin, qualityMax } = store.app.get('pngquant')

          execFile(
            pngquant,
            [
              '--quality',
              `${qualityMin}-${qualityMax}`,
              '-fo',
              output,
              file.path
            ],
            err => {
              if (err) {
                console.log(err)
                reject(err)
              }

              const compressedSize = getFileSize(output)
              this.#sendToRenderer(file, originalSize, compressedSize)
              resolve()
            }
          )
          break
        }

        case MIME_TYPE_ENUM.gif: {
          execFile(gifsicle, ['-o', output, file.path], err => {
            if (err) {
              console.log(err)
              reject(err)
            }

            const compressedSize = getFileSize(output)
            this.#sendToRenderer(file, originalSize, compressedSize)
            resolve()
          })
          break
        }

        case MIME_TYPE_ENUM.svg: {
          readFile(file.path, (err, buffer) => {
            if (err) {
              console.log(err)
              reject(err)
            }

            const { data } = svg.optimize(buffer)
            writeFile(output, data, err => {
              if (err) console.log(err)

              const compressedSize = getFileSize(output)
              this.#sendToRenderer(file, originalSize, compressedSize)
              resolve()
            })
          })
          break
        }
      }
    })
  }

  #formatOutputData (file: DroppedFile, originalSize: FileSize, compressedSize: FileSize): FileOutput {
    return {
      name: file.name,
      path: file.path,
      originalSize,
      compressedSize,
      compressionPercentage: Number(Math.abs(
        compressedSize.bytes * (100 / originalSize.bytes) - 100
      ).toFixed(2))
    }
  }

  #sendToRenderer (file: DroppedFile, originalSize: FileSize, compressedSize: FileSize) {
    this.#context.webContents.send(
      'file-complete',
      this.#formatOutputData(file, originalSize, compressedSize)
    )
  }
}
