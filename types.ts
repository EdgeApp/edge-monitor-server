import { ServerScope } from 'nano'

import { ServerConfig } from './src/config'
import { TestFixtureFull } from './src/db/dbTestFixtures'

export type PluginProcessor = (
  serverConfig: ServerConfig,
  connection: ServerScope,
  fixture: TestFixtureFull
) => Promise<void>

export interface MonitorPlugin {
  pluginId: string
  pluginProcessor: PluginProcessor
}
