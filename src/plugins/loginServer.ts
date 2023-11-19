import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {
  asArray,
  asDate,
  asMaybe,
  asNumber,
  asObject,
  asString,
  Cleaner
} from 'cleaners'
import { syncedDocument } from 'edge-server-tools'
import { RequestInit } from 'node-fetch'

import { MonitorPlugin } from '../../types'
import { describe, it } from '../util/testing'
import { cleanFetch, PluginProcessor } from '../util/utils'

chai.use(chaiAsPromised)

const { assert } = chai
const pluginId = 'loginServer'
const runFrequencyMs = 1000 * 60 * 5 // 5 mins

const asLoginServerCluster = asObject({
  servers: asMaybe(asArray(asString), () => ['https://login.edge.app']),
  edgeApiKey: asMaybe(asString, 'dummyApiKey'),
  passwordUserId: asMaybe(asString, 'dummyKey'),
  passwordAuth: asMaybe(asString, 'dummyPasswordAuth'),
  pin2Id: asMaybe(asString, 'dummyPin2Id'),
  pin2Auth: asMaybe(asString, 'dummyPin2Auth'),
  userIdExists: asMaybe(asString, 'xxxx'),
  userIdAvailable: asMaybe(asString, 'xxxx')
})
const asLoginServerData = asObject({
  doc: asMaybe(
    asObject({
      clusters: asMaybe(asArray(asLoginServerCluster), () => [
        asLoginServerCluster({})
      ])
    }),
    () => ({
      clusters: [asLoginServerCluster({})]
    })
  )
})

const asLoginResult = asObject({
  results: asObject({
    appId: asString,
    created: asDate,
    loginId: asString,
    syncToken: asString,
    passwordAuthBox: asObject({
      encryptionType: asNumber,
      data_base64: asString,
      iv_hex: asString
    }),
    passwordAuthSnrp: asObject({
      salt_hex: asString,
      n: asNumber,
      r: asNumber,
      p: asNumber
    })
  })
})

const asUserIdCheck = asObject({
  results: asObject({
    loginId: asString,
    passwordAuthSnrp: asObject({
      salt_hex: asString,
      n: asNumber,
      r: asNumber,
      p: asNumber
    })
  })
})

type LoginServerCluster = ReturnType<typeof asLoginServerCluster>

const syncedDoc = syncedDocument(pluginId, asLoginServerData)

const pluginProcessor: PluginProcessor = async (
  serverConfig,
  connection
): Promise<void> => {
  if (syncedDoc == null) return
  const { clusters } = syncedDoc.doc.doc
  for (const cluster of clusters) {
    const { servers } = cluster
    for (const server of servers) {
      await describe(`loginServers:${server}`, async () => {
        await it('testPasswordLogin', async () =>
          await testPasswordLogin(server, cluster))
        await it('testPin2Login', async () =>
          await testPin2Login(server, cluster))
        await it('testUserIdExists', async () =>
          await testUserIdExists(server, cluster))
        await it('testUserIdAvailable', async () =>
          await testUserIdAvailable(server, cluster))
      })
    }
  }
}

const testPasswordLogin = async (
  server: string,
  cluster: LoginServerCluster
): Promise<void> => {
  const { passwordUserId, passwordAuth } = cluster
  await fetchApiLogin(
    server,
    cluster,
    {
      userId: passwordUserId,
      passwordAuth
    },
    asLoginResult
  )
}

const testPin2Login = async (
  server: string,
  cluster: LoginServerCluster
): Promise<void> => {
  const { pin2Id, pin2Auth } = cluster
  await fetchApiLogin(
    server,
    cluster,
    {
      pin2Id,
      pin2Auth
    },
    asLoginResult
  )
}

const testUserIdExists = async (
  server: string,
  cluster: LoginServerCluster
): Promise<void> => {
  const { userIdExists } = cluster
  await fetchApiLogin(
    server,
    cluster,
    {
      userId: userIdExists
    },
    asUserIdCheck
  )
}

const testUserIdAvailable = async (
  server: string,
  cluster: LoginServerCluster
): Promise<void> => {
  const { userIdAvailable } = cluster

  // Available usernames will return a 400 on fetch and would
  // throw on fetchApiLogin, hence assert that the promise rejects
  await assert.isRejected(
    fetchApiLogin(
      server,
      cluster,
      {
        userId: userIdAvailable
      },
      asUserIdCheck
    )
  )
}

const fetchApiLogin = async <T>(
  server: string,
  cluster: LoginServerCluster,
  body: any,
  cleaner: Cleaner<T>
): Promise<T> => {
  const { edgeApiKey } = cluster

  const url = `${server}/api/v2/login`
  const options: RequestInit = {
    headers: {
      Authorization: `Token ${edgeApiKey}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(body)
  }
  const result = await cleanFetch(url, options, cleaner)
  return result
}

export const loginServerPlugin: MonitorPlugin = {
  pluginId,
  runFrequencyMs,
  syncedDoc,
  pluginProcessor
}
