import { Cleaner } from 'cleaners'
import { ServerScope } from 'nano'
import fetch, { RequestInit } from 'node-fetch'

import { ServerConfig } from '../config'

export type PluginProcessor = (
  serverConfig: ServerConfig,
  connection: ServerScope
) => Promise<void>

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

export const cleanFetch = async <T>(
  uri: string,
  options: RequestInit,
  cleaner: Cleaner<T>,
  error?: string
): Promise<T> => {
  try {
    const results = await fetch(uri, options)
    if (!results.ok) {
      const text = await results.text()
      throw new Error(text)
    }
    const jsonRes = await results.json()
    return cleaner(jsonRes)
  } catch (e) {
    if (error == null) throw e
    throw new Error(`Error while fetching: ${error}`)
  }
}

export const logObject = (arg: any): void =>
  console.log(JSON.stringify(arg, null, 2))

/**
 * Checks if obj1 contains all the keys and matching values of
 * obj2
 *
 * @param obj1 Super-set object
 * @param obj2 Sub-set object
 */
export const objectsDeepMatch = (
  obj1: Record<string, any>,
  obj2: Record<string, any>
): void => {
  for (const key in obj2) {
    if (!(key in obj1)) {
      throw new Error(`objectsDeepMatch missing key ${key}`)
    }

    const value1 = obj1[key]
    const value2 = obj2[key]

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      objectsDeepMatch(value1, value2)
    } else if (value1 !== value2) {
      throw new Error(
        `objectsDeepMatch mismatch ${key} ${String(value1)} !== ${String(
          value2
        )}`
      )
    }
  }
}
