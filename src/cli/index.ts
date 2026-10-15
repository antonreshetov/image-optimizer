import { runCli } from './cli'

runCli(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  cwd: process.cwd(),
  interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY)
})
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
