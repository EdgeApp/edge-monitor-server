import { asArray, asMaybe, asObject, asString } from 'cleaners'
import { syncedDocument } from 'edge-server-tools'

import { MonitorPlugin } from '../../types'
import { logObject, PluginProcessor } from '../util/utils'

const pluginId = 'loginServer'
const runFrequencyMs = 60000

const asLoginServerData = asObject({
  doc: asMaybe(
    asObject({
      servers: asMaybe(asArray(asString), () => []),
      loginKey: asMaybe(asString, 'dummyKey'),
      apiKey: asMaybe(asString, 'dummyApiKey')
    }),
    () => ({
      servers: [],
      loginKey: 'dummyKey',
      apiKey: 'dummyApiKey'
    })
  )
})

const syncedDoc = syncedDocument(pluginId, asLoginServerData)

const pluginProcessor: PluginProcessor = async (
  serverConfig,
  connection
): Promise<void> => {
  if (syncedDoc == null) return
  logObject(serverConfig)
  logObject(syncedDoc)
}

export const loginServerPlugin: MonitorPlugin = {
  pluginId,
  runFrequencyMs,
  syncedDoc,
  pluginProcessor
}
