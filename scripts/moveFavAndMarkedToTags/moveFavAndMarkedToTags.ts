#!/usr/bin/env node
import { COLS, TABLES, TAGS } from '../../src/constants.ts';
import { localDb } from '../../src/db/initDb.ts';
import { log } from '../lib/log.ts';

/*
 Moving marked and favorites into tag table
 - set to handle marked
*/

const db = await localDb();

(async () => {
  const recordsStream = await db(TABLES.MEDIA).where(COLS.MEDIA.MARKED, true).stream()
  let count = 0;
  for await (const record of recordsStream) {
    try {
      const trx = await db.transaction();
      await trx(TABLES.MEDIA_TAGS).insert({[COLS.MEDIA_TAGS.VALUE]: TAGS.MARKED, [COLS.MEDIA_TAGS.MEDIA_ID]: record.id})
      await trx.commit()
      count += 1;
      console.log(record.path, count)
    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }
  process.exit();
})();
