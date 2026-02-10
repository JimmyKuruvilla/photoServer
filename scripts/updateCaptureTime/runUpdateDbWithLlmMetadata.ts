#!/usr/bin/env node
import { Knex } from 'knex';
import { COLS, TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { isImage, isIngestable } from '../../src/guards.ts';
import { getImageDescriptors } from '../../src/libs/imageDescriptors.ts';
import { createLogger } from '../../src/libs/pinologger.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
/*
 SOURCE_PATH=/mnt/backup/media tsx ./scripts/updateMetadata/runUpdateDbWithLlmMetadata.ts
 TEST: SOURCE_PATH=/home/j/scripts/photoServer/test/source tsx ./scripts/updateMetadata/runUpdateDbWithLlmMetadata.ts
 Updates all files with llm metadata
*/
const log = createLogger('[UPDATE_CAPTURE_TIME]')
const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;

export const updateCaptureTime = async (db: Knex, filePath: string) => {

  log.info(`FILE_PATH: ${filePath}`)
  if (!isIngestable({ filePath, log })) {
    return
  }
  
  /*
  1. add capture_time column timestamptz nullable, no default
  2. single fn to take a filepath, determine type, and return a datetime in utc
  3. update ingestion pipeline with it. 
  */
  const captureTime = await doSomething({ filePath })

  if (captureTime) {
    const trx = await db.transaction();
    try {
      await trx(TABLES.MEDIA).where(COLS.MEDIA.CAPTURE_TIME, filePath).update({ capture_time: captureTime });
      await trx.commit();
      log.info(`${filePath}: ${captureTime}`)
    } catch (error: any) {
      await trx.rollback();
      log.info(`ERROR ${error.message}`);
    }
  }
  else {
    log.warn(`CaptureTime does not exist `)
  }
}

if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    async (filePath: string) => updateCaptureTime(db, filePath)
  );

  const size = await db.raw(`SELECT pg_size_pretty(pg_total_relation_size('${TABLES.MEDIA}'));`)
  console.log(count, size);
  process.exit();
})();
