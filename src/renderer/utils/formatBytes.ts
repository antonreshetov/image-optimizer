export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const base = 1024
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base))
  const maximumFractionDigits = unitIndex >= 2 ? 1 : 0
  const value = new Intl.NumberFormat(undefined, {
    maximumFractionDigits
  }).format(bytes / Math.pow(base, unitIndex))

  return `${value} ${units[unitIndex]}`
}
