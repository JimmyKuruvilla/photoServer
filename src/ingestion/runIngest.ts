#!/usr/bin/env node
import { purgeDeadDbLinks } from '../../scripts/purgeDeadDbLinks/purgeDeadDbLinks.ts';
import { getDb, getTableSizes } from '../../src/db/initDb.ts';
import { log } from '../libs/log.ts';
import { recursiveTraverseDir } from '../libs/recursiveTraverseDir.ts';
import { ingest } from './ingestion.ts';

/**
 * Updates all files in SOURCE_PATH with entire db update flow: insert, create thumbnail, record face count, generate hash
*/

const db = await getDb();
const sourcePath = process.env.SOURCE_PATH;
const targetPath = process.env.TARGET_PATH;

if (!sourcePath || !targetPath) {
  throw new Error('Need both source and target dirs');
}

(async () => {
  log(`PURGING_ANY_DEAD_DB_LINKS_TO_FILESYSTEM`)
  await purgeDeadDbLinks()

  const count = await recursiveTraverseDir(
    sourcePath,
    (filepath: string) => ingest(filepath, targetPath, { shouldMove: false })
  );

  const sizes = await getTableSizes(db)
  console.log(count, sizes);
  process.exit();
})();
