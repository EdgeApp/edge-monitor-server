import { SyncedDocument } from 'edge-server-tools'

import { PluginProcessor } from './src/util/utils'

export interface MonitorPlugin {
  pluginId: string
  runFrequencyMs: number
  syncedDoc: SyncedDocument<unknown>
  pluginProcessor: PluginProcessor
}
