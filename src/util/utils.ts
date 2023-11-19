export const ONE_HOUR_IN_MS = 1000 * 60 * 60 // Delay an hour between checks
export const STARS = '***********************************'
export const SNOOZING = `SNOOZING ${STARS}`

export const datelog = (...args: any): void => {
  const now = new Date().toISOString()
  console.log(`${now}: `, ...args)
}

export const snooze = async (ms: number): Promise<void> =>
  await new Promise((resolve: () => void) => setTimeout(resolve, ms))

export const dateString = (): string => {
  const date = new Date()
  return date.toDateString() + ':' + date.toTimeString()
}

export const logObject = (arg: any): void =>
  console.log(JSON.stringify(arg, null, 2))
