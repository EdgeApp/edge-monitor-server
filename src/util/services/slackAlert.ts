import fetch from 'node-fetch'

import { serverConfig } from '../../config'

export function slackAlert(text: string): void {
  const { slackWebhookLoggingUrl } = serverConfig

  fetch(slackWebhookLoggingUrl, {
    body: JSON.stringify({ text }),
    headers: { 'content-type': 'application/json' },
    method: 'POST'
  }).catch(error => console.log('Could not log to Slack', error))
}

export function slackStatus(text: string): void {
  const { slackWebhookStatusUrl } = serverConfig

  fetch(slackWebhookStatusUrl, {
    body: JSON.stringify({ text }),
    headers: { 'content-type': 'application/json' },
    method: 'POST'
  }).catch(error => console.log('Could not log to Slack', error))
}
