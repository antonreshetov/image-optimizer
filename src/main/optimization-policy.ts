export const runSettledJob = async (
  worker: () => Promise<void>,
  onError: (error: unknown) => void
) => {
  try {
    await worker()
  } catch (error) {
    onError(error)
  }
}

export const isGeneratedOutputDirectory = (
  name: string,
  addToSubfolder: boolean
) => addToSubfolder && name === 'minified'
