import nano from 'nano'

import { serverConfig } from './config'
import { setupDatabases } from './db/dbSetup'
import { getTestFixtures, TestFixtureFull } from './db/dbTestFixtures'
import { plugins } from './plugins'
import { datelog, snooze } from './util/utils'

/** Tracks which fixtures have spawned loops */
const activeLoops = new Set<string>()

const main = async (): Promise<void> => {
  const { couchUri } = serverConfig
  const connection = nano(couchUri)
  await setupDatabases(connection)

  // Spawn loops for fixtures (runs forever)
  await spawnFixtureLoops(connection)
}

/**
 * Spawns independent loops for each fixture.
 * New fixtures get loops spawned here.
 * Deleted/modified fixtures are handled within each loop.
 */
const spawnFixtureLoops = async (
  connection: nano.ServerScope
): Promise<void> => {
  while (true) {
    const testFixtures = await getTestFixtures(connection)

    if (testFixtures != null && testFixtures.length > 0) {
      for (const fixture of testFixtures) {
        const { fixtureId } = fixture

        // Spawn a new loop if we haven't already
        if (!activeLoops.has(fixtureId)) {
          activeLoops.add(fixtureId)
          // Fire and forget - each loop runs independently
          runFixtureLoop(connection, fixture).catch((e: unknown) => {
            datelog(`Loop for ${fixtureId} crashed: ${String(e)}`)
            activeLoops.delete(fixtureId)
          })
        }
      }
    } else {
      datelog('No fixtures found')
    }

    // Check for new fixtures every 5 seconds
    await snooze(5000)
  }
}

/**
 * Runs a single fixture in its own independent loop.
 * Each fixture manages its own schedule without blocking others.
 */
const runFixtureLoop = async (
  connection: nano.ServerScope,
  initialFixture: TestFixtureFull
): Promise<void> => {
  const { fixtureId } = initialFixture
  datelog(`Starting independent loop for fixture: ${fixtureId}`)

  // Run immediately on first iteration
  let nextRunTime = Date.now()

  while (true) {
    const now = Date.now()

    // Wait until next scheduled run
    if (nextRunTime > now) {
      const waitMs = nextRunTime - now
      await snooze(waitMs)
    }

    // Re-fetch fixture to get latest config (e.g., updated runFrequencyMins)
    const testFixtures = await getTestFixtures(connection)
    const fixture = testFixtures?.find(f => f.fixtureId === fixtureId)

    // If fixture was deleted, exit this loop
    if (fixture == null) {
      datelog(`Fixture ${fixtureId} no longer exists, stopping loop`)
      activeLoops.delete(fixtureId)
      return
    }

    const { pluginId, runFrequencyMins } = fixture
    const plugin = plugins.find(p => p.pluginId === pluginId)

    if (plugin != null) {
      const { pluginProcessor } = plugin
      await pluginProcessor(serverConfig, connection, fixture)
    } else {
      datelog(`No plugin found for ${pluginId}`)
    }

    // Schedule next run based on current runFrequencyMins
    const end = Date.now()
    nextRunTime = end + runFrequencyMins * 60 * 1000
  }
}

main().catch(e => datelog(e))
