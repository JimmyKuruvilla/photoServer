#!/usr/bin/env node
import { purgeDeadDbLinks } from '../../scripts/purgeDeadDbLinks/purgeDeadDbLinks.ts';
import { localDb } from '../../src/db/initDb.ts';
import { log } from '../libs/log.ts';
import { recursiveTraverseDir } from '../libs/recursiveTraverseDir.ts';
import { ingest } from './ingestion.ts';

/**
 * Updates all files in SOURCE_PATH with entire db update flow: insert, create thumbnail, record face count, generate hash
*/

const db = await localDb();
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
    (filepath:string) => ingest(filepath, targetPath, { shouldMove: false })
  );

  const { rows } = await db.raw(`
  select
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))),
    pg_total_relation_size(quote_ident(table_name))
  from information_schema.tables
  where table_schema = 'public'
  order by 3 desc;`
  )
  console.log(count, rows);
  process.exit();
})();
