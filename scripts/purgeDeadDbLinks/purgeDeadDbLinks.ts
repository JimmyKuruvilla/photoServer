#!/usr/bin/env node

/*
 Check if db file path exists, and if not delete it from db
*/

import { localDb } from '../../src/db/initDb.ts';
import { doesFileExist } from '../lib/file.ts';
import { log } from '../lib/log.ts';

const db = await localDb();

export const purgeDeadDbLinks = async () => {
  const recordsStream = await db('images').select('*').stream()

  for await (const record of recordsStream) {
    try {
      log(`CHECKING_IF_FILE_EXISTS ${record.path}`)
      const fileExists = await doesFileExist(record.path)

      if (!fileExists) {
        const trx = await db.transaction();
        await trx('images').where('path', record.path).del()
        await trx.commit()
        log(`PURGE ${record.path} from DB`)
      }

    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }
}
