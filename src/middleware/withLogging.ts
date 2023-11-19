import { stringifyError } from 'edge-server-tools'
import { HttpResponse, Serverlet } from 'serverlet'
import { ExpressRequest } from 'serverlet/express'

import { appSettings } from '../db/dbSettings'
import { LoggedRequest } from '../types/requestTypes'
import { UnavailableError } from '../types/responseTypes'
import { slackAlert } from '../util/services/slackAlert'

let pending = 0

/**
 * Log the final outcome of a server call.
 */
export const withLogging = (
  server: Serverlet<LoggedRequest>
): Serverlet<ExpressRequest> => async request => {
  const { method, path, req } = request
  const { ip, body } = req

  const date = new Date()
  const logs: string[] = []
  function log(message: string): void {
    logs.push(`${Date.now() - date.valueOf()}ms: ${message}`)
  }
  log.debug = function debug(message: string): void {
    if (appSettings.doc.debugLogs) log(message)
  }
  log.debugTime = async function debugTime<T>(
    message: string,
    promise: Promise<T>
  ): Promise<T> {
    const start = Date.now()
    const depth = ++pending
    const out = await promise.finally(() => --pending)
    log.debug(message + ` took ${Date.now() - start}ms, ${depth} pending`)
    return out
  }

  async function runServer(): Promise<HttpResponse> {
    return await server({ ...request, date, ip, json: body, log })
  }
  const response = await runServer().catch(error => {
    log(stringifyError(error))

    // Some errors have special HTTP statuses:
    if (error instanceof UnavailableError) return { status: 503 }
    return { status: 500 }
  })

  const { status = 200 } = response
  const duration = Date.now() - date.valueOf()
  logs.unshift(
    `${date.toISOString()} ${ip} ${method} ${path} ${status} ${duration}ms`
  )
  const message = logs.join('\n  + ')
  console.log(message)
  if (status === 500) slackAlert(message)
  return response
}
