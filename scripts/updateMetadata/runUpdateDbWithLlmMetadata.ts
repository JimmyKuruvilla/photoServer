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
const log = createLogger('[LLM_METADATA]')
const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;

export const updateLlmMetadata = async (db: Knex, filePath: string) => {

  log.info(`FILE_PATH: ${filePath}`)
  if (!isIngestable({ filePath, log })) {
    return
  }

  if (!isImage(filePath)) {
    log.info(`SKIPPING_FILE__NOT_AN_IMAGE: ${filePath}`);
    return
  }
  
  const llmMetadata = await getImageDescriptors({ filePath })

  if (llmMetadata) {
    const trx = await db.transaction();
    try {
      await trx(TABLES.MEDIA).where(COLS.MEDIA.PATH, filePath).update({ metadata: llmMetadata });
      await trx.commit();
      log.info(`${filePath}: ${llmMetadata?.shortDescription}`)
    } catch (error: any) {
      await trx.rollback();
      log.info(`ERROR ${error.message}`);
    }
  }
  else {
    log.warn(`Metadata does not exist `)
  }
}

if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    async (filePath: string) => updateLlmMetadata(db, filePath)
  );

  const size = await db.raw(`SELECT pg_size_pretty(pg_total_relation_size('${TABLES.MEDIA}'));`)
  console.log(count, size);
  process.exit();
})();
