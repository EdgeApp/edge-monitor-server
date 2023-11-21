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

  const nextRun: { [docId: string]: number } = {}
  const now = Date.now()

  do {
    const testFixtures = await getTestFixtures(connection)
    if (testFixtures != null && testFixtures.length > 0) {
      for (const fixture of testFixtures) {
        const { fixtureId } = fixture
        if (nextRun[fixtureId] == null) {
          nextRun[fixtureId] = now
        }
        const next = Date.now()

        if (nextRun[fixtureId] > next) {
          continue
        }
        const { pluginId, runFrequencyMins } = fixture
        const plugin = plugins.find(p => p.pluginId === pluginId)

        if (plugin != null) {
          // Run the fixture with it's matching plugin
          const { pluginProcessor } = plugin
          await pluginProcessor(serverConfig, connection, fixture)
        }
        const end = Date.now()
        nextRun[fixtureId] = end + runFrequencyMins * 1000 * 60
      }
    } else {
      datelog('No fixtures found')
    }
    await snooze(5000)
  } while (true)
}

main().catch(e => datelog(e))
