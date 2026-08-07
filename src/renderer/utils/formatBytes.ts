export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const base = 1024
  const precision = decimals < 0 ? 0 : decimals
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base))
  const value = Number.parseFloat(
    (bytes / Math.pow(base, unitIndex)).toFixed(precision)
  )

  return `${value} ${units[unitIndex]}`
}
