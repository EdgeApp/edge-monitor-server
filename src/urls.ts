import { pickMethod, pickPath, Serverlet } from 'serverlet'

import { dummyGetRoute, dummyPostRoute } from './routes/dummyRoute'
import { DbRequest } from './types/requestTypes'
import { statusCodes, statusResponse } from './types/responseTypes'

const missingRoute: Serverlet<DbRequest> = request =>
  statusResponse(statusCodes.notFound, `Unknown API endpoint ${request.path}`)

const obsoleteRoute: Serverlet<DbRequest> = () =>
  statusResponse(statusCodes.obsolete)

const healthCheckRoute: Serverlet<DbRequest> = () =>
  statusResponse(statusCodes.success)

const urls: { [path: string]: Serverlet<DbRequest> } = {
  '/': healthCheckRoute,

  '/api/v1/dummy/?': pickMethod({
    GET: dummyGetRoute,
    POST: dummyPostRoute
  }),

  // Deactivated endpoints:
  '/api/obsolete/?': obsoleteRoute
}
export const allRoutes: Serverlet<DbRequest> = pickPath(urls, missingRoute)
