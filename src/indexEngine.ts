import nano from 'nano'

import { serverConfig } from './config'
import { setupDatabases } from './db/dbSetup'
import { plugins } from './plugins'
import { datelog, startPluginEngineLoop } from './util/utils'

const main = async (): Promise<void> => {
  const { couchUri } = serverConfig
  const connection = nano(couchUri)
  const syncedDocuments = plugins.map(p => p.syncedDoc)
  await setupDatabases(connection, syncedDocuments)

  for (const plugin of plugins) {
    const { runFrequencyMs } = plugin
    startPluginEngineLoop(
      serverConfig,
      connection,
      plugin,
      runFrequencyMs // 30 seconds
    ).catch(e => console.error(e))
  }
}

main().catch(e => datelog(e))
