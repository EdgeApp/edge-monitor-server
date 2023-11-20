import chai from 'chai'
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
import { RequestInit } from 'node-fetch'

import { MonitorPlugin, PluginProcessor } from '../../types'
import { describe, it } from '../util/testing'
import { cleanFetch, objectsDeepMatch } from '../util/utils'

const { assert } = chai

const pluginId = 'fetchPlugin'

const asMethod = asValue('GET', 'POST')

const asApiCall = asObject({
  testName: asMaybe(asString),
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
      await describe(`${fixtureId}:${pluginId}:${server}`, async () => {
        for (const apiCall of apiCalls) {
          const {
            body,
            expectThrow,
            headers,
            method,
            path,
            result,
            testName
          } = apiCall
          const name =
            testName != null
              ? `${testName} ${method} ${path}`
              : `${method} ${path}`
          await it(`${name}`, async () => {
            const p = fetchHelper(method, headers, server, path, body)
            if (expectThrow) {
              let didThrow = false
              try {
                await p
              } catch (e) {
                didThrow = true
              }
              assert.isTrue(didThrow)
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

const fetchHelper = async (
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

export const fetchPlugin: MonitorPlugin = {
  pluginId,
  pluginProcessor
}
