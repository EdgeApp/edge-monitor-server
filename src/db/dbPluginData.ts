import { asObject, asString, asUnknown, Cleaner } from 'cleaners'
import { asCouchDoc, CouchDoc, DatabaseSetup } from 'edge-server-tools'
import { ServerScope } from 'nano'

export interface PluginData {
  pluginId: string
  data: unknown
}

/**
 * Example regular (non-rolling) db used to store a person
 */
export const asDbPluginData: Cleaner<CouchDoc<PluginData>> = asCouchDoc(
  asObject({
    pluginId: asString,
    data: asUnknown
  })
)
type DbPluginData = ReturnType<typeof asDbPluginData>

export const dbPluginDataSetup: DatabaseSetup = {
  name: 'monitor_plugindata'
}

/**
 * Looks up an API key.
 */
export async function getPluginData(
  connection: ServerScope,
  pluginId: string
): Promise<PluginData | undefined> {
  const db = connection.db.use(dbPluginDataSetup.name)
  const reply = await db.list({
    include_docs: true,
    key: pluginId
  })
  const [clean] = reply.rows.map(row =>
    unpackDummyRegularDoc(asDbPluginData(row.doc))
  )
  return clean
}

function unpackDummyRegularDoc(doc: DbPluginData): PluginData {
  return {
    pluginId: doc.id,
    data: doc.doc.data
  }
}
