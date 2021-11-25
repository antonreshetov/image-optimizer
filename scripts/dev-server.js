process.env.NODE_ENV = 'development'

const vite = require('vite')
const { spawn } = require('child_process')
const path = require('path')
const chalk = require('chalk')
const chokidar = require('chokidar')
const electron = require('electron')

let electronProcess = null
let rendererPort = 0

async function startRenderer () {
  const config = require('../config/vite.js')

  const server = await vite.createServer({
    ...config,
    mode: 'development'
  })

  return server.listen()
}

function startElectron () {
  if (electronProcess) {
    return
  }

  const args = [
    path.resolve(__dirname, '../src/main/index.dev.js'),
    rendererPort
  ]

  electronProcess = spawn(electron, args)

  electronProcess.stdout.on('data', data => {
    console.log(chalk.blueBright('[Electron] ') + chalk.white(data.toString()))
  })

  electronProcess.stderr.on('data', data => {
    console.log(chalk.redBright('[Electron] ') + chalk.white(data.toString()))
  })
}

function restartElectron () {
  if (electronProcess) {
    electronProcess.kill()
    electronProcess = null
  }

  startElectron()
}

async function start () {
  console.log(`${chalk.blueBright('===============================')}`)
  console.log(`${chalk.blueBright('Starting Electron + vite Dev Server...')}`)
  console.log(`${chalk.blueBright('===============================')}`)

  const devServer = await startRenderer()
  rendererPort = devServer.config.server.port

  startElectron()

  chokidar.watch(path.resolve(__dirname, '../src/main')).on('change', () => {
    restartElectron()
  })
}

start()
