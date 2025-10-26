#!/usr/bin/env node
import { localDb } from '../src/db/initDb.ts';
import { genFileHash } from './lib/hash.ts';
import { log } from './lib/log.ts';

/*
 Template starting point for db scripts
*/

const db = await localDb();

(async () => {
  const recordsStream = await db('images').where('hash', null).stream()
  
  for await (const record of recordsStream) {
    try {
      const hash = await genFileHash(record.path)
      const trx = await db.transaction();
      await trx('images').where('path', record.path).update({ hash });
      await trx.commit()
      console.log(hash, record.path)
    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }
  process.exit();
})();
