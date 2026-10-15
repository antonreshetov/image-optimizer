import { app, dialog } from 'electron'
import { execFile } from 'node:child_process'
import { lstat, mkdir, readlink, symlink, unlink } from 'node:fs/promises'
import path from 'node:path'

const COMMAND_NAME = 'imgopt'
const LINK_DIRECTORY = '/usr/local/bin'
const LINK_PATH = path.join(LINK_DIRECTORY, COMMAND_NAME)

// AppleScript user cancelled the administrator prompt.
const USER_CANCELED = -128

const linkWithAdminRights = (target: string) =>
  new Promise<boolean>((resolve, reject) => {
    // Paths go through argv and `quoted form of` so they are never parsed as
    // shell or AppleScript code.
    execFile(
      '/usr/bin/osascript',
      [
        '-e',
        'on run argv',
        '-e',
        'do shell script "mkdir -p " & quoted form of item 1 of argv & " && ln -sfh " & quoted form of item 2 of argv & " " & quoted form of item 3 of argv with administrator privileges',
        '-e',
        'end run',
        LINK_DIRECTORY,
        target,
        LINK_PATH
      ],
      (error, _stdout, stderr) => {
        if (!error) return resolve(true)
        if (stderr.includes(`(${USER_CANCELED})`)) return resolve(false)
        reject(error)
      }
    )
  })

const getExistingLink = async () => {
  try {
    const stat = await lstat(LINK_PATH)
    return stat.isSymbolicLink() ? await readlink(LINK_PATH) : LINK_PATH
  } catch {
    return null
  }
}

export const installCommandLineTool = async () => {
  if (!app.isPackaged) {
    await dialog.showMessageBox({
      type: 'info',
      message: 'The command line tool is available only in the packaged app.'
    })
    return
  }

  const target = path.join(process.resourcesPath, 'bin', COMMAND_NAME)
  const existing = await getExistingLink()

  if (existing === target) {
    await dialog.showMessageBox({
      type: 'info',
      message: `'${COMMAND_NAME}' is already installed in ${LINK_DIRECTORY}.`
    })
    return
  }

  if (existing) {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Replace', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      message: `${LINK_PATH} already exists. Replace it?`
    })
    if (response !== 0) return
  }

  try {
    try {
      await mkdir(LINK_DIRECTORY, { recursive: true })
      if (existing) await unlink(LINK_PATH)
      await symlink(target, LINK_PATH)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'EACCES' && code !== 'EPERM') throw error
      if (!(await linkWithAdminRights(target))) return
    }
  } catch (error) {
    dialog.showErrorBox(
      'Unable to install the command line tool',
      error instanceof Error ? error.message : String(error)
    )
    return
  }

  await dialog.showMessageBox({
    type: 'info',
    message: `'${COMMAND_NAME}' is installed.`,
    detail: `Run '${COMMAND_NAME} --help' in a new terminal window to get started.`
  })
}
