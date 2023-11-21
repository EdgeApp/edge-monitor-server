import { HttpHeaders, HttpResponse } from 'serverlet'

interface StatusCode {
  code: number
  httpStatus: number
  message: string
}

export const statusCodes: { [key: string]: StatusCode } = {
  success: {
    code: 0,
    httpStatus: 200,
    message: 'Success'
  },
  error: {
    code: 1,
    httpStatus: 503,
    message: 'Error'
  },
  accountExists: {
    code: 2,
    httpStatus: 401,
    message: 'Account already exists'
  },
  noAccount: {
    code: 3,
    httpStatus: 404,
    message: 'No account'
  },
  invalidPassword: {
    code: 4,
    httpStatus: 401,
    message: 'Invalid Password'
  },
  conflict: {
    code: 10,
    httpStatus: 409,
    message: 'Conflicting change'
  },
  rateLimit: {
    code: 11,
    httpStatus: 429,
    message: 'Too many failed login attempts'
  },
  obsolete: {
    code: 1000,
    httpStatus: 410,
    message: 'Obsolete API'
  },

  // Variants of the "error" status code:
  invalidRequest: {
    code: 1,
    httpStatus: 401,
    message: 'Invalid request'
  },
  notFound: {
    code: 1,
    httpStatus: 404,
    message: 'Not found'
  },

  serverOverload: {
    code: 11,
    httpStatus: 503,
    message: 'Server overloaded'
  }
}

export function htmlResponse(body: string, status: number = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
    body
  }
}

/**
 * Construct an HttpResponse object with a JSON body.
 */
export function jsonResponse(
  body: unknown,
  opts: { status?: number; headers?: HttpHeaders } = {}
): HttpResponse {
  const { status = 200, headers = {} } = opts
  return {
    status,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }
}

/**
 * A generic success or failure response.
 */
export function statusResponse(
  statusCode: StatusCode = statusCodes.success,
  message: string = statusCode.message
): HttpResponse {
  const { code, httpStatus } = statusCode
  const body = {
    status_code: code,
    message,
    results: undefined
  }
  return jsonResponse(body, { status: httpStatus })
}

/**
 * A success response, with payload.
 */
export function payloadResponse(
  payload: unknown,
  statusCode: StatusCode = statusCodes.success,
  message: string = statusCode.message
): HttpResponse {
  const { code, httpStatus } = statusCode
  const body = {
    status_code: code,
    message,
    results: payload
  }
  return jsonResponse(body, { status: httpStatus })
}

export class UnavailableError extends Error {}
