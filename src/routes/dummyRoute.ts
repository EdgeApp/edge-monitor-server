import { asMaybe, asNumber, asObject } from 'cleaners'
import { ServerScope } from 'nano'
import { Serverlet } from 'serverlet'

import { DbRequest } from '../types/requestTypes'
import {
  payloadResponse,
  statusCodes,
  statusResponse
} from '../types/responseTypes'

const asDummyCleaner = asObject({ something: asNumber })
type Dummy = ReturnType<typeof asDummyCleaner>

const dummy = async (
  connection: ServerScope,
  payload: Dummy,
  date: Date
): Promise<number> => {
  console.log(date.toISOString(), payload)
  return payload.something + 1
}

export const dummyGetRoute: Serverlet<DbRequest> = async request => {
  const { connection, date, log, json } = request

  const clean = asMaybe(asDummyCleaner)(json)
  if (clean == null) return statusResponse(statusCodes.invalidRequest)

  // Add entries to the keys database:
  const out = await log.debugTime('dummy', dummy(connection, clean, date))

  return payloadResponse({ answer: out })
}

export const dummyPostRoute: Serverlet<DbRequest> = async request => {
  const { connection, date, log, json } = request

  const clean = asMaybe(asDummyCleaner)(json)
  if (clean == null) return statusResponse(statusCodes.invalidRequest)

  // Add entries to the keys database:
  const out = await log.debugTime('dummy', dummy(connection, clean, date))

  return payloadResponse({ answer: out })
}
