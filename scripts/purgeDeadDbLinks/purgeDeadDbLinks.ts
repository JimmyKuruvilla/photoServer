#!/usr/bin/env node

/*
 Check if db file path exists, and if not delete it from db
*/

import { TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { doesFileExist } from '../../src/libs/file.ts';
import { createLogger } from '../../src/libs/pinologger.ts';
const log = createLogger('[PURGE]')

const db = await getDb();

export const purgeDeadDbLinks = async () => {
  const recordsStream = await db(TABLES.MEDIA).select('*').stream()

  for await (const record of recordsStream) {
    try {
      log.info(`CHECKING_IF_FILE_EXISTS ${record.path}`)
      const fileExists = await doesFileExist(record.path)

      if (!fileExists) {
        const trx = await db.transaction();
        await trx(TABLES.MEDIA).where('path', record.path).del()
        await trx.commit()
        log.info(`Removed ${record.path} from DB`)
      }

    } catch (error: any) {
      log.error(`ERROR: ${error.message}`)
    }
  }
}
