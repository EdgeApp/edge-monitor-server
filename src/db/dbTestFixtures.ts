import {
  asMaybe,
  asNumber,
  asObject,
  asString,
  asUnknown,
  Cleaner
} from 'cleaners'
import { asCouchDoc, CouchDoc, DatabaseSetup } from 'edge-server-tools'
import { ServerScope } from 'nano'

import infoServer from '../../fixtures/infoServer.json'
import loginServer from '../../fixtures/loginServer.json'
import ratesServer from '../../fixtures/ratesServer.json'

export interface TestFixture {
  fixtureId?: string
  pluginId: string
  runFrequencyMins: number
  data: unknown
}

export type TestFixtureFull = TestFixture &
  Required<Pick<TestFixture, 'fixtureId'>>

/**
 * Example regular (non-rolling) db used to store a person
 */
export const asDbTestFixture: Cleaner<CouchDoc<TestFixture>> = asCouchDoc(
  asObject({
    data: asObject({
      clusters: asUnknown
    }),
    pluginId: asString,
    runFrequencyMins: asMaybe(asNumber, 30)
  })
)

export const dbTestFixturesSetup: DatabaseSetup = {
  name: 'monitor_fixtures',
  templates: {
    ratesServer,
    infoServer,
    loginServer
  }
}

/**
 * Looks up an API key.
 */
export async function getTestFixtures(
  connection: ServerScope
): Promise<TestFixtureFull[] | undefined> {
  const db = connection.db.use(dbTestFixturesSetup.name)
  const reply = await db.list({
    include_docs: true
  })
  const clean = reply.rows.map(row => {
    const fixture = asDbTestFixture(row.doc)
    const out = unpackTestFixture(fixture)
    return out
  })
  return clean
}

function unpackTestFixture(doc: CouchDoc<TestFixture>): TestFixtureFull {
  return {
    fixtureId: doc.id,
    pluginId: doc.doc.pluginId,
    runFrequencyMins: doc.doc.runFrequencyMins,
    data: doc.doc.data
  }
}
