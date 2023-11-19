import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { asArray, asMaybe, asObject, asString, Cleaner } from 'cleaners'
import { syncedDocument } from 'edge-server-tools'
import { RequestInit } from 'node-fetch'

import { MonitorPlugin } from '../../types'
import { describe, it } from '../util/testing'
import { cleanFetch, PluginProcessor } from '../util/utils'

chai.use(chaiAsPromised)

const { assert } = chai
const pluginId = 'infoServer'
const runFrequencyMs = 1000 * 60 * 30 // 30 mins

const asInfoServerCluster = asObject({
  servers: asMaybe(asArray(asString), () => ['https://info.edge.app']),
  appId: asMaybe(asString, 'edge'),
  hmacUser: asMaybe(asString, 'user'),
  hmacData: asMaybe(asString, 'hmad data'),
  hmacSignature: asMaybe(asString, 'hex signature')
})
const asInfoServerData = asObject({
  doc: asMaybe(
    asObject({
      clusters: asMaybe(asArray(asInfoServerCluster), () => [
        asInfoServerCluster({})
      ])
    }),
    () => ({
      clusters: [asInfoServerCluster({})]
    })
  )
})

type InfoServerCluster = ReturnType<typeof asInfoServerCluster>

const syncedDoc = syncedDocument(pluginId, asInfoServerData)

const pluginProcessor: PluginProcessor = async (
  serverConfig,
  connection
): Promise<void> => {
  if (syncedDoc == null) return
  const { clusters } = syncedDoc.doc.doc
  for (const cluster of clusters) {
    const { servers } = cluster
    for (const server of servers) {
      await describe(`infoServers:${server}`, async () => {
        await it('testGetEdgeServers', async () =>
          await testGetEdgeServers(server, cluster))
        await it('testCreateHmac', async () =>
          await testCreateHmac(server, cluster))
      })
    }
  }
}

const testGetEdgeServers = async (
  server: string,
  cluster: InfoServerCluster
): Promise<void> => {
  await fetchGet(
    server,
    '/v1/edgeServers',
    asObject({
      loginServers: asArray(asString),
      syncServers: asArray(asString),
      infoServers: asArray(asString),
      corsServers: asArray(asString),
      ratesServers: asArray(asString),
      referralServers: asArray(asString)
    })
  )
}

const testCreateHmac = async (
  server: string,
  cluster: InfoServerCluster
): Promise<void> => {
  const { hmacData, hmacSignature, hmacUser } = cluster
  const result = await fetchPost(
    server,
    `/v1/createHmac/${hmacUser}`,
    {
      data: hmacData
    },
    asObject({
      signature: asString
    })
  )
  assert.equal(result.signature, hmacSignature)
}

const fetchPost = async <T>(
  server: string,
  path: string,
  body: any,
  cleaner: Cleaner<T>
): Promise<T> => {
  const url = `${server}${path}`
  const options: RequestInit = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(body)
  }
  const result = await cleanFetch(url, options, cleaner)
  return result
}

const fetchGet = async <T>(
  server: string,
  path: string,
  cleaner: Cleaner<T>
): Promise<T> => {
  const url = `${server}${path}`
  const options: RequestInit = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'GET'
  }
  const result = await cleanFetch(url, options, cleaner)
  return result
}

export const infoServerPlugin: MonitorPlugin = {
  pluginId,
  runFrequencyMs,
  syncedDoc,
  pluginProcessor
}
