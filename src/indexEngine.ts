import nano from 'nano'

import { serverConfig } from './config'
import { setupDatabases } from './db/dbSetup'
import { getTestFixtures } from './db/dbTestFixtures'
import { plugins } from './plugins'
import { datelog, snooze } from './util/utils'

const main = async (): Promise<void> => {
  const { couchUri } = serverConfig
  const connection = nano(couchUri)
  await setupDatabases(connection)

  do {
    const testFixtures = await getTestFixtures(connection)
    if (testFixtures != null && testFixtures.length > 0) {
      for (const fixture of testFixtures) {
        const { pluginId } = fixture
        const plugin = plugins.find(p => p.pluginId === pluginId)

        if (plugin == null) continue
        // Run the fixture with it's matching plugin
        const { pluginProcessor } = plugin
        await pluginProcessor(serverConfig, connection, fixture)
      }
    } else {
      datelog('No fixtures found')
    }
    await snooze(60000)
  } while (true)
}

main().catch(e => datelog(e))
