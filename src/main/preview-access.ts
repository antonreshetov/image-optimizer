import path from 'node:path'

const allowedPreviewPaths = new Set<string>()

const normalize = (value: string) => path.resolve(value)

export const allowPreviewPaths = (...paths: string[]) => {
  for (const filePath of paths) allowedPreviewPaths.add(normalize(filePath))
}

export const isPreviewPathAllowed = (filePath: string) =>
  allowedPreviewPaths.has(normalize(filePath))
