#!/usr/bin/env node
import { recursiveTraverseDir } from '../src/listings'
import { localDb } from '../src/db/initDb'
import { updateFaceCount } from './faces'
/*
 cd ~/scripts/photoServer
 source ./python/venv/bin/activate
 node ./scripts/runUpdateDbWithFaces.js /mnt/backup/media
*/

const db = await localDb();

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    async (filepath) => updateFaceCount(db, filepath)
  );

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
