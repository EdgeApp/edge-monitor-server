import { asBoolean, asMaybe, asObject } from 'cleaners'
import {
  asReplicatorSetupDocument,
  DatabaseSetup,
  syncedDocument
} from 'edge-server-tools'

/**
 * Live-updating server options stored in the `login_settings` database.
 */
const asServerSettings = asObject({
  // Mode toggles:
  debugLogs: asMaybe(asBoolean, false)
})

export const appReplicators = syncedDocument(
  'replicators',
  asReplicatorSetupDocument
)

export const appSettings = syncedDocument('settings', asServerSettings.withRest)

export const settingsSetup: DatabaseSetup = {
  name: 'monitor_settings',

  syncedDocuments: [appReplicators, appSettings]
}
