process.env.NODE_ENV = 'production'

async function build () {
  const chalk = require('chalk')
  const buildVue = require('./build-vue')
  const buildElectron = require('./build-electron')

  console.log(`${chalk.blueBright('===============================')}`)
  console.log(`${chalk.blueBright('Build started...')}`)
  console.log(`${chalk.blueBright('===============================')}`)

  await buildVue()
  await buildElectron()

  console.log(`${chalk.greenBright('===============================')}`)
  console.log(`${chalk.greenBright('Build success!')}`)
  console.log(`${chalk.greenBright('===============================')}`)
}

build()
