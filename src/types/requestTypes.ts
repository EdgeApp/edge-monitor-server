import { ServerScope } from 'nano'
import { ExpressRequest } from 'serverlet/express'

export interface Logger {
  (message: string): void

  debug: (message: string) => void
  debugTime: <T>(message: string, promise: Promise<T>) => Promise<T>
}

export interface LoggedRequest extends ExpressRequest {
  readonly date: Date
  readonly ip: string
  readonly json: unknown
  readonly log: Logger
}

export interface DbRequest extends LoggedRequest {
  readonly connection: ServerScope
}
