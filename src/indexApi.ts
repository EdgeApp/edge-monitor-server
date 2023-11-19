import cluster from 'cluster'
import express from 'express'
import http from 'http'
import nano, { ServerScope } from 'nano'
import { makeExpressRoute } from 'serverlet/express'

import { serverConfig } from './config'
import { setupDatabases } from './db/dbSetup'
import { withCors } from './middleware/withCors'
import { withLogging } from './middleware/withLogging'
import { allRoutes } from './urls'

async function main(): Promise<void> {
  // Set up CouchDB databases:
  const { couchUri } = serverConfig
  const connection = nano(couchUri)
  await setupDatabases(connection)

  if (cluster.isPrimary) manageServers()
  else await server(connection)
}

function manageServers(): void {
  const { instanceCount } = serverConfig

  // Spin up children:
  for (let i = 0; i < instanceCount; ++i) {
    cluster.fork()
  }

  // Restart workers when they exit:
  cluster.on('exit', (worker, code, signal) => {
    const { pid = '?' } = worker.process
    console.log(`Worker ${pid} died with code ${code} and signal ${signal}`)
    cluster.fork()
  })
}

async function server(connection: ServerScope): Promise<void> {
  // Bind the database to the request:
  const server = withCors(
    withLogging(request => allRoutes({ ...request, connection }))
  )

  // Set up Express:
  const app = express()
  app.enable('trust proxy')
  app.use(express.json({ limit: '1mb' }))
  app.use('/', makeExpressRoute(server))

  // Start the HTTP server:
  const { listenPort, listenHost } = serverConfig
  const httpServer = http.createServer(app)
  httpServer.listen(listenPort, listenHost)
  console.log(`HTTP server listening on port ${listenPort}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
