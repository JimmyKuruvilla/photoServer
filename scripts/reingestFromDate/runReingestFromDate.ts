#!/usr/bin/env node
import { Knex } from 'knex';
import { COLS, TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { isImage, isIngestable } from '../../src/guards.ts';
import { getImageDescriptors } from '../../src/libs/imageDescriptors.ts';
import { createLogger } from '../../src/libs/pinologger.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
import { getMediaCaptureDate } from '../../src/libs/creationTime.ts';
import { ingest } from '../../src/ingestion/ingestion.ts';
/*
 Updates all files that are in the db beyond a cutoff date. 
 Doesn't do anything for files that were moved out of __dropoff but didn't make it to the db

 If files and folders exist, but they don't exist in the db - they won't show up in web.
 To reprocess those folders can do this: 
 SHOULD_AI=false SHOULD_MOVE=false SHOULD_PURGE=false SOURCE_PATH=/mnt/backup/media/YYYY-MM-DD TARGET_PATH=/mnt/backup/media env tsx /home/j/scripts/photoServer/src/ingestion/runIngest.ts
*/

const log = createLogger('[REINGEST_FROM_DATE]')

export const reingestFromDate = async () => {
  const db = await getDb();
  const cutoffDate = new Date('2026-02-01');

  try {

    const records = await db(TABLES.MEDIA)
      .where(COLS.MEDIA.CREATED_AT, '>=', cutoffDate)

    const targetPath = ''
    for (const record of records) {
      log.info(`${JSON.stringify(record.path)}`)
      await ingest(record.path, targetPath, { shouldMove: false, shouldAI: false })
    }
  } catch (error: any) {
    log.info(`ERROR ${error.message}`);
  }

  process.exit();

}

await reingestFromDate() 