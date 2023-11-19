import {
  asArray,
  asBoolean,
  asEither,
  asMaybe,
  asNull,
  asObject,
  asString,
  asUnknown,
  asValue
} from 'cleaners'

import { MonitorPlugin, PluginProcessor } from '../../types'
import { datelog } from '../util/utils'

const pluginId = 'fetchPlugin'

const asMethod = asValue('GET', 'POST')

const asApiCall = asObject({
  method: asMaybe(asMethod, 'GET'),
  path: asMaybe(asString, '/v1/api/endpoint'),
  expectThrow: asMaybe(asBoolean, false),
  headers: asMaybe(asObject(asUnknown), () => ({ 'api-key': '0xsomeapikey' })),
  body: asMaybe(asEither(asObject(asUnknown), asNull), null),
  result: asMaybe(asObject(asUnknown), () => ({ result: { name: 'hello' } }))
})

const asCluster = asObject({
  servers: asMaybe(asArray(asString), () => ['https://info.edge.app']),
  apiCalls: asMaybe(asArray(asApiCall), () => [asApiCall({})])
})
const asFetchPluginData = asMaybe(
  asObject({
    clusters: asMaybe(asArray(asCluster), () => [asCluster({})])
  }),
  () => ({
    clusters: [asCluster({})]
  })
)

const pluginProcessor: PluginProcessor = async (
  serverConfig,
  connection,
  fixture
): Promise<void> => {
  const { data, pluginId, fixtureId } = fixture
  const { clusters } = asFetchPluginData(data)
  for (const cluster of clusters) {
    const { servers, apiCalls } = cluster
    for (const server of servers) {
      // TODO: Do something
      datelog(apiCalls, server)
    }
  }
}

export const fetchPlugin: MonitorPlugin = {
  pluginId,
  pluginProcessor
}
