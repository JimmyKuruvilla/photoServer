#!/usr/bin/env node

/*
 Check if db file path exists, and if not delete it from db
*/

import { TABLES } from '../../src/constants.ts';
import { localDb } from '../../src/db/initDb.ts';
import { doesFileExist } from '../../src/libs/file.ts';
import { log } from '../../src/libs/log.ts';

const db = await localDb();

export const purgeDeadDbLinks = async () => {
  const recordsStream = await db(TABLES.MEDIA).select('*').stream()

  for await (const record of recordsStream) {
    try {
      log(`CHECKING_IF_FILE_EXISTS ${record.path}`)
      const fileExists = await doesFileExist(record.path)

      if (!fileExists) {
        const trx = await db.transaction();
        await trx(TABLES.MEDIA).where('path', record.path).del()
        await trx.commit()
        log(`PURGE: ${record.path} from DB`)
      }

    } catch (error: any) {
      log(`ERROR: ${error.message}`)
    }
  }
}
