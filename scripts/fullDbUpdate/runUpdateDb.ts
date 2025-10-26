#!/usr/bin/env node
import { localDb } from '../../src/db/initDb.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { createOrUpdateFromFilePath } from '../lib/updateDb.ts';

/**
 * Updates all files in SOURCE_PATH with entire db update flow: insert, create thumbnail, record face count
 */
const db = await localDb();
const sourceDir = process.env.SOURCE_PATH!;

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    createOrUpdateFromFilePath
  );
  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
