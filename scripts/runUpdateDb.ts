#!/usr/bin/env node
import { recursiveTraverseDir } from '../src/listings.js'
import { localDb } from '../src/db/initDb.js'
import { createOrUpdateFromFilePath } from './updateDb.js'

const db = await localDb();

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    createOrUpdateFromFilePath
  );
  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
