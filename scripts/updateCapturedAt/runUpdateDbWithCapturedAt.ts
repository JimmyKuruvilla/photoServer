#!/usr/bin/env node
import { Knex } from 'knex';
import { COLS, TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { isImage, isIngestable } from '../../src/guards.ts';
import { getImageDescriptors } from '../../src/libs/imageDescriptors.ts';
import { createLogger } from '../../src/libs/pinologger.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
import { getMediaCaptureDate } from '../../src/libs/creationTime.ts';
/*
 Updates all files with capturedAt
*/
const log = createLogger('[UPDATE_CAPTURED_AT]')
const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;

export const updateCapturedAt = async (db: Knex, filePath: string) => {

  log.info(`FILE_PATH: ${filePath}`)
  if (!isIngestable({ filePath, log })) {
    return
  }

  const capturedAt = await getMediaCaptureDate(filePath)

  if (capturedAt) {
    const trx = await db.transaction();
    try {
      await trx(TABLES.MEDIA).where(COLS.MEDIA.PATH, filePath).update({ [COLS.MEDIA.CAPTURED_AT]: capturedAt });
      await trx.commit();
      log.info(`${filePath}: ${capturedAt}`)
    } catch (error: any) {
      await trx.rollback();
      log.info(`ERROR ${error.message}`);
    }
  }
  else {
    log.warn(`CapturedAt does not exist `)
  }
}

if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    async (filePath: string) => updateCapturedAt(db, filePath)
  );

  const size = await db.raw(`SELECT pg_size_pretty(pg_total_relation_size('${TABLES.MEDIA}'));`)
  console.log(count, size);
  process.exit();
})();
