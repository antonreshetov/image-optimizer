import { build } from 'electron-builder'
import { build as config } from '../../package.json'

export default function () {
  // "as any" used to suppress TS error over MacOS "arch" object type
  // "as any" используется для предотвращения ошибки TS при типе объекта "arch" на MacOS
  return build({ config } as any)
}
