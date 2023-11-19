import { serverConfig } from '../config'
import { slackStatus } from './services/slackAlert'
import { datelog } from './utils'

interface TestResult {
  description: string
  pass: boolean
  error?: string
}

let results: TestResult[] = []

export const describe = async (
  description: string,
  func: () => Promise<void>
): Promise<void> => {
  datelog(`*** ${description} START ***`)
  results = []
  await func()
  datelog(`*** ${description} END *****`)
  const failures = results.filter(r => !r.pass)
  if (failures.length > 0) {
    const messages = failures.map(
      f => `[FAILED] ${f.description}: ${f.error ?? ''}`
    )
    const message = `FAILED Test group ${description}\n` + messages.join('\n')
    console.log(`Messaging Errors to Slack\n${message}`)
    slackStatus(message)
  }
}

export const it = async (
  description: string,
  func: () => Promise<void>
): Promise<void> => {
  try {
    await func()
    results.push({
      description,
      pass: true
    })
    logPassed(description)
  } catch (e) {
    const error = String(e)
    results.push({
      description,
      pass: false,
      error
    })
    logFailed(`${description} ${error}`)
  }
}

const logPf = (passed: boolean, msg: string): void => {
  const { logColor } = serverConfig

  if (logColor) {
    if (passed) {
      datelog(`\x1b[32m✔ [PASSED]\x1b[0m ${msg}`)
    } else {
      datelog(`\x1b[31m✘ [FAILED]\x1b[0m ${msg}`)
    }
  } else {
    if (passed) {
      datelog(`✔ [PASSED] ${msg}`)
    } else {
      datelog(`✘ [FAILED] ${msg}`)
    }
  }
}

const logPassed = (msg: string): void => logPf(true, msg)
const logFailed = (msg: string): void => logPf(false, msg)
