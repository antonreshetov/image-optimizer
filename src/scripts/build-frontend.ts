import buildVue from './build-vue'
import chalk from 'chalk'

process.env.NODE_ENV = 'production'

async function build () {
  console.log(`${chalk.blueBright('\nBuild frontend started...\n')}`)

  await buildVue()

  console.log(`${chalk.greenBright('\nBuild frontend success!\n')}`)
}

build()
