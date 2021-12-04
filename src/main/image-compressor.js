const { isFile, isFolder, getFileSize } = require('./utils')
const { ensureDirSync, readFile, writeFile, readdir } = require('fs-extra')
const { execFile } = require('child_process')
const mozjpeg = require('mozjpeg')
const pngquant = require('pngquant-bin')
const gifsicle = require('gifsicle')
const svg = require('svgo')
const junk = require('junk')
const mime = require('mime-types')
const queue = require('queue')
const store = require('../main/store')
const path = require('path')
const util = require('util')
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

class ImageOptimizer {
  #queue
  #context

  constructor (files = [], context) {
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
      const timeSpent = `${(timeEnd - timeStart) / 1000}s`

      this.#context.webContents.send('optimization-complete')
      this.#context.webContents.send('job-time', timeSpent)
    })
  }

  #optimize (files) {
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
        const files = await readdirAsync(file.path)
        const _files = []

        files.filter(junk.not).forEach(file => {
          if (isFolder(`${folderPath}/${file}`)) return

          _files.push({
            name: file,
            path: `${folderPath}/${file}`,
            type: mime.lookup(file)
          })
        })

        if (_files.length) {
          this.#optimize(_files)
        }
      }
    })

    this.#queue.start()
  }

  #processFile = (file, output, context) => {
    const originalSize = getFileSize(file.path)

    return new Promise((resolve, reject) => {
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

  #formatOutputData (file, originalSize, compressedSize) {
    return {
      name: file.name,
      path: file.path,
      originalSize,
      compressedSize,
      compressionPercentage: Math.abs(
        compressedSize.bytes * (100 / originalSize.bytes) - 100
      ).toFixed(2)
    }
  }

  #sendToRenderer (file, originalSize, compressedSize) {
    this.#context.webContents.send(
      'file-complete',
      this.#formatOutputData(file, originalSize, compressedSize)
    )
  }
}

module.exports = {
  ImageOptimizer
}
