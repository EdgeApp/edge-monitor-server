import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
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
import { syncedDocument } from 'edge-server-tools'
import { RequestInit } from 'node-fetch'

import { MonitorPlugin } from '../../types'
import { describe, it } from '../util/testing'
import { cleanFetch, objectsDeepMatch, PluginProcessor } from '../util/utils'

chai.use(chaiAsPromised)

const { assert } = chai
const pluginId = 'genericServer'
const runFrequencyMs = 1000 * 60 * 30 // 30 mins

const asMethod = asValue('GET', 'POST')

const asApiCall = asObject({
  method: asMaybe(asMethod, 'GET'),
  path: asMaybe(asString, '/v1/api/endpoint'),
  expectThrow: asMaybe(asBoolean, false),
  headers: asMaybe(asObject(asUnknown), () => ({ 'api-key': '0xsomeapikey' })),
  body: asMaybe(asEither(asObject(asUnknown), asNull), null),
  result: asMaybe(asObject(asUnknown), () => ({ result: { name: 'hello' } }))
})

const asGenericServerCluster = asObject({
  servers: asMaybe(asArray(asString), () => ['https://info.edge.app']),
  apiCalls: asMaybe(asArray(asApiCall), () => [asApiCall({})])
})
const asGenericServerData = asObject({
  doc: asMaybe(
    asObject({
      clusters: asMaybe(asArray(asGenericServerCluster), () => [
        asGenericServerCluster({})
      ])
    }),
    () => ({
      clusters: [asGenericServerCluster({})]
    })
  )
})

const syncedDoc = syncedDocument(pluginId, asGenericServerData)

const pluginProcessor: PluginProcessor = async (
  serverConfig,
  connection
): Promise<void> => {
  if (syncedDoc == null) return
  const { clusters } = syncedDoc.doc.doc
  for (const cluster of clusters) {
    const { servers, apiCalls } = cluster
    for (const server of servers) {
      await describe(`genericServers:${server}`, async () => {
        for (const apiCall of apiCalls) {
          const { body, expectThrow, headers, method, path, result } = apiCall
          await it(`${method} ${path}`, async () => {
            const p = fetchGP(method, headers, server, path, body)
            if (expectThrow) {
              await assert.isRejected(p)
            } else {
              const response = await p
              objectsDeepMatch(response, result)
            }
          })
        }
      })
    }
  }
}

const fetchGP = async (
  method: 'GET' | 'POST',
  headers: any,
  server: string,
  path: string,
  body: any
): Promise<any> => {
  const url = `${server}${path}`
  const options: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    method
  }
  if (body != null) {
    options.body = JSON.stringify(body)
  }
  const result = await cleanFetch(url, options, asUnknown)
  return result
}

export const genericServerPlugin: MonitorPlugin = {
  pluginId,
  runFrequencyMs,
  syncedDoc,
  pluginProcessor
}
