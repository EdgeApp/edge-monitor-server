import nano from 'nano'

import { serverConfig } from './config'
import { setupDatabases } from './db/dbSetup'
import { plugins } from './plugins'
import { datelog, snooze } from './util/utils'

const DELAY = 1000 * 10

const main = async (): Promise<void> => {
  const { couchUri } = serverConfig
  const connection = nano(couchUri)
  const syncedDocuments = plugins.map(p => p.syncedDoc)
  await setupDatabases(connection, syncedDocuments)

  const nextTime: { [pluginId: string]: number } = {}
  const now = Date.now()
  plugins.forEach(p => (nextTime[p.pluginId] = now))

  do {
    for (const plugin of plugins) {
      const start = Date.now()
      const { pluginId, pluginProcessor, runFrequencyMs } = plugin
      if (nextTime[pluginId] > start) continue
      try {
        await pluginProcessor(serverConfig, connection)
      } catch (e) {
        datelog(`Error in ${pluginId}: ${String(e)}`)
      } finally {
        const end = Date.now()
        nextTime[pluginId] = end + runFrequencyMs
      }
    }
    await snooze(DELAY)
  } while (true)
}

main().catch(e => datelog(e))
