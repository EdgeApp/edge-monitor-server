/* eslint-disable @typescript-eslint/no-var-requires */

import { asDate, asObject, asString } from 'cleaners'
import {
  asMaybeConflictError,
  CouchDoc,
  makeRollingDatabase
} from 'edge-server-tools'
import { ServerScope } from 'nano'

/**
 * Initial date of the database. Replace with an actual ISO date such as
 * '2016-01-01T00:00:00.000Z'
 */
const DEFAULT_DB_START_DATE = 'PUT ACTUAL ISO TIME OF DATABASE START'

/**
 * Example rolling database used for logs
 */
const asDummyDoc = asObject({
  date: asDate,
  event: asString
})
type DummyDoc = ReturnType<typeof asDummyDoc>

export const dbDummyRolling = makeRollingDatabase({
  name: 'dummy_rolling',
  options: { partitioned: true },

  // Rolling stuff:
  archiveStart: new Date(DEFAULT_DB_START_DATE),
  cleaner: asDummyDoc,
  getDate,
  period: 'quarter',

  documents: {}
})

export async function addDummyRolling(
  connection: ServerScope,
  dummyDoc: DummyDoc
): Promise<void> {
  try {
    await dbDummyRolling.insert(connection, packDummyDoc(dummyDoc))
  } catch (error) {
    if (asMaybeConflictError(error) == null) throw error
    const date = new Date(dummyDoc.date.valueOf() + 1)
    await addDummyRolling(connection, { ...dummyDoc, date })
  }
}

export async function* streamDummy(
  connection: ServerScope,
  opts: {
    afterDate?: Date
    beforeDate?: Date
  } = {}
): AsyncIterableIterator<DummyDoc> {
  const { afterDate, beforeDate } = opts

  for await (const row of dbDummyRolling.listAsStream(connection, {
    afterDate,
    descending: true,
    end_key: afterDate == null ? undefined : afterDate,
    start_key: beforeDate == null ? undefined : beforeDate
  })) {
    yield unpackDummyDoc(row)
  }
}

function getDate(doc: CouchDoc<DummyDoc>): Date {
  return doc.doc.date
}

function packDummyDoc(log: DummyDoc): CouchDoc<DummyDoc> {
  return {
    doc: log,
    id: log.date.toISOString()
  }
}

function unpackDummyDoc(doc: CouchDoc<DummyDoc>): DummyDoc {
  return {
    date: getDate(doc),
    event: doc.doc.event
  }
}
