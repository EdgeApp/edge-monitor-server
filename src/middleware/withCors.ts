import { Serverlet } from 'serverlet'

/**
 * Adds CORS headers to OPTIONS responses.
 */
export const withCors = <T>(
  server: Serverlet<T>
): Serverlet<T> => async request => {
  const response = await server(request)
  const { headers = {} } = response
  return {
    ...response,
    headers: {
      ...headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'DELETE, GET, OPTIONS, POST, PUT'
    }
  }
}
