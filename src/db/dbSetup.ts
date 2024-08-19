import { setupDatabase, SetupDatabaseOptions } from 'edge-server-tools'
import { ServerScope } from 'nano'

import { appReplicators, settingsSetup } from './dbSettings'
import { dbTestFixturesSetup } from './dbTestFixtures'

export async function setupDatabases(
  connection: ServerScope,
  disableWatching: boolean = false
): Promise<void> {
  const options: SetupDatabaseOptions = {
    disableWatching,
    replicatorSetup: appReplicators
  }

  await setupDatabase(connection, settingsSetup, options)
  await Promise.all([setupDatabase(connection, dbTestFixturesSetup, options)])
}
