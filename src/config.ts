import { makeConfig } from 'cleaner-config'
import { asBoolean, asNumber, asObject, asOptional, asString } from 'cleaners'
import { cpus } from 'os'

/**
 * Configures the server process as a whole,
 * such as where to listen and how to talk to the database.
 */
const asServerConfig = asObject({
  // Logging options
  logColor: asOptional(asBoolean, true),

  // Performance options:
  instanceCount: asOptional(asNumber, cpus().length),

  // HTTP server options:
  listenHost: asOptional(asString, '127.0.0.1'),
  listenPort: asOptional(asNumber, 8008),

  // Databases:
  couchUri: asOptional(asString, 'http://username:password@localhost:5984'),

  // Slack notifications
  slackWebhookLoggingUrl: asOptional(
    asString,
    'https://hooks.slack.com/services/xxx/xxx/XXX'
  ),
  slackWebhookStatusUrl: asOptional(
    asString,
    'https://hooks.slack.com/services/xxx/xxx/XXX'
  )
})

export const serverConfig = makeConfig(asServerConfig, './config.json')
export type ServerConfig = ReturnType<typeof asServerConfig>
