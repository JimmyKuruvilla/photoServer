#!/usr/bin/env node
import { TABLES } from '../../src/constants.ts';
import { localDb } from '../../src/db/initDb.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { isIgnored } from '../../src/utils.ts';
import { ingest } from '../lib/ingestion.ts';
import { log } from '../lib/log.ts';
import { purgeDeadDbLinks } from '../purgeDeadDbLinks/purgeDeadDbLinks.ts';

/**
 * Updates all files in SOURCE_PATH with entire db update flow: insert, create thumbnail, record face count, generate hash
*/

const db = await localDb();
const sourceDir = process.env.SOURCE_PATH!;

const ingestFileToDb = async (filepath: string) => {
  if (isIgnored(filepath)) {
    log(`IGNORE ${filepath}`)
  } else {
    return ingest(filepath)
  }
}



(async () => {
  log(`PURGING_ANY_DEAD_DB_LINKS_TO_FILESYSTEM`)
  await purgeDeadDbLinks()

  const count = await recursiveTraverseDir(
    sourceDir,
    ingestFileToDb
  );

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size(${TABLES.MEDIA}) );`)
  console.log(count, size);
  process.exit();
})();
