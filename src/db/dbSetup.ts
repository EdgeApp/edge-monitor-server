import {
  setupDatabase,
  SetupDatabaseOptions,
  SyncedDocument
} from 'edge-server-tools'
import { ServerScope } from 'nano'

import { dbPluginDataSetup } from './dbPluginData'
import { appReplicators, settingsSetup } from './dbSettings'

export async function setupDatabases(
  connection: ServerScope,
  syncedDocuments: Array<SyncedDocument<unknown>>,
  disableWatching: boolean = false
): Promise<void> {
  const options: SetupDatabaseOptions = {
    disableWatching,
    replicatorSetup: appReplicators
  }

  dbPluginDataSetup.syncedDocuments = syncedDocuments

  await setupDatabase(connection, settingsSetup, options)
  await Promise.all([setupDatabase(connection, dbPluginDataSetup, options)])
}
