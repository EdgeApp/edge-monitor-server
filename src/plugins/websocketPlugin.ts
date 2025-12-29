import chai from 'chai'
import {
  asArray,
  asBoolean,
  asMaybe,
  asNumber,
  asObject,
  asString
} from 'cleaners'
import WebSocket, { ClientOptions } from 'ws'

import { MonitorPlugin, PluginProcessor } from '../../types'
import { describe } from '../util/testing'

const { assert } = chai

const pluginId = 'websocketPlugin'

const asWebSocketCall = asObject({
  /**
   * Human-readable name for this test case.
   * Defaults to "WebSocket {url}".
   */
  testName: asMaybe(asString),
  /** Path to append to the server URL. Default: '/' */
  path: asMaybe(asString, '/'),
  /**
   * Maximum time in milliseconds to wait for the connection to open.
   * Default: 5000
   */
  connectTimeout: asMaybe(asNumber, 5000),
  /**
   * Message to send after connecting.
   * If omitted, only verifies connection opens.
   */
  sendMessage: asMaybe(asString),
  /**
   * Whether to wait for a response after sending.
   * Only used if sendMessage is set. Default: false
   */
  expectResponse: asMaybe(asBoolean, false),
  /**
   * Maximum time in milliseconds to wait for a response.
   * Only used if expectResponse is true. Default: 5000
   */
  responseTimeout: asMaybe(asNumber, 5000),
  /**
   * Substring the response must contain.
   * If omitted, any response is accepted.
   */
  responseContains: asMaybe(asString),
  /**
   * Custom headers for the WebSocket handshake
   * (e.g., authentication tokens). Default: {}
   */
  headers: asMaybe(asObject(asString), () => ({}))
})

const asCluster = asObject({
  /**
   * Array of WebSocket server base URLs.
   * Each server will be tested with all calls in this cluster.
   */
  servers: asMaybe(asArray(asString), () => []),
  /**
   * Array of WebSocket call configurations to run against every server.
   */
  calls: asMaybe(asArray(asWebSocketCall), () => [asWebSocketCall({})])
})

const asWebSocketPluginData = asMaybe(
  asObject({
    /**
     * Array of server clusters to test.
     * Each cluster contains servers and the calls to run against them.
     */
    clusters: asMaybe(asArray(asCluster), () => [asCluster({})])
  }),
  () => ({
    clusters: [asCluster({})]
  })
)

/** Processes WebSocket health check fixtures. */
const pluginProcessor: PluginProcessor = async (
  _serverConfig,
  _connection,
  fixture
): Promise<void> => {
  const { data, pluginId: fixturePluginId, fixtureId } = fixture
  const { clusters } = asWebSocketPluginData(data)

  for (const cluster of clusters) {
    const { servers, calls } = cluster
    for (const server of servers) {
      await describe(`${fixtureId}:${fixturePluginId}:${server}`, async it => {
        for (const call of calls) {
          const {
            testName,
            path,
            connectTimeout,
            sendMessage,
            expectResponse,
            responseTimeout,
            responseContains,
            headers
          } = call

          const url = `${server}${path}`
          const name = testName ?? `WebSocket ${url}`

          await it(name, async () => {
            await checkWebSocket({
              url,
              connectTimeout,
              sendMessage,
              expectResponse,
              responseTimeout,
              responseContains,
              headers
            })
          })
        }
      })
    }
  }
}

interface CheckWebSocketOptions {
  /** Full WebSocket URL to connect to */
  url: string
  /** Connection timeout in milliseconds */
  connectTimeout: number
  /** Optional message to send after connecting */
  sendMessage?: string
  /** Whether to wait for a response after sending */
  expectResponse: boolean
  /** Response timeout in milliseconds */
  responseTimeout: number
  /** Substring the response must contain */
  responseContains?: string
  /** Custom headers for the handshake */
  headers: Record<string, string>
}

/** Performs a WebSocket health check. Resolves on success, rejects on failure. */
const checkWebSocket = async (
  options: CheckWebSocketOptions
): Promise<void> => {
  const {
    url,
    connectTimeout,
    sendMessage,
    expectResponse,
    responseTimeout,
    responseContains,
    headers
  } = options

  return await new Promise((resolve, reject) => {
    const wsOptions: ClientOptions = {
      headers
    }
    const ws = new WebSocket(url, wsOptions)

    // Track timeout timers for cleanup
    let connectTimer: NodeJS.Timeout | undefined
    let responseTimer: NodeJS.Timeout | undefined

    // Prevent double resolution from race conditions
    let settled = false

    const cleanup = (): void => {
      if (connectTimer != null) clearTimeout(connectTimer)
      if (responseTimer != null) clearTimeout(responseTimer)
    }

    const settle = (fn: () => void): void => {
      if (settled) return
      settled = true
      cleanup()
      ws.close()
      fn()
    }

    connectTimer = setTimeout(() => {
      settle(() =>
        reject(new Error(`Connection timeout after ${connectTimeout}ms`))
      )
    }, connectTimeout)

    ws.on('error', (err: Error & { code?: string }) => {
      let errMsg = 'Unknown error'
      if (err.message !== '' && err.message != null) {
        errMsg = err.message
      } else if (err.code != null) {
        errMsg = err.code
      } else {
        errMsg = String(err)
      }
      settle(() => reject(new Error(`WebSocket error: ${errMsg}`)))
    })

    ws.on('close', (code: number, reason: Buffer) => {
      settle(() =>
        reject(
          new Error(
            `WebSocket closed unexpectedly: ${code} ${reason.toString()}`
          )
        )
      )
    })

    ws.on('open', () => {
      if (connectTimer != null) {
        clearTimeout(connectTimer)
        connectTimer = undefined
      }

      // Connection successful - if no message to send, we're done
      if (sendMessage == null) {
        settle(() => resolve())
        return
      }

      // Send message
      ws.send(sendMessage)

      // If we don't expect a response, we're done
      if (!expectResponse) {
        settle(() => resolve())
        return
      }

      // Wait for response
      responseTimer = setTimeout(() => {
        settle(() =>
          reject(new Error(`Response timeout after ${responseTimeout}ms`))
        )
      }, responseTimeout)

      ws.on('message', (data: WebSocket.Data) => {
        const message = data.toString()

        // Validate response contains expected substring
        if (responseContains != null) {
          assert.include(
            message,
            responseContains,
            `Response should contain "${responseContains}"`
          )
        }

        settle(() => resolve())
      })
    })
  })
}

export const websocketPlugin: MonitorPlugin = {
  pluginId,
  pluginProcessor
}
