export const DEFAULT_PNG_QUALITY = 75

const isPngQuality = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 100

export const resolvePngQuality = (value: unknown, legacyMaximum: unknown) => {
  if (isPngQuality(value)) return value
  if (isPngQuality(legacyMaximum)) return legacyMaximum
  return DEFAULT_PNG_QUALITY
}

export const getPngquantQualityRange = (quality: number) =>
  `0-${resolvePngQuality(quality, undefined)}`
