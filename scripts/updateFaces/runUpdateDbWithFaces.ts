#!/usr/bin/env node
import { localDb } from '../../src/db/initDb.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { updateFaceCount } from '../lib/faces.ts';
/*
 cd ~/scripts/photoServer
 source ./python/venv/bin/activate
 SOURCE_PATH=/mnt/backup/media tsx ./scripts/updateFaces/runUpdateDbWithFaces.ts
 Updates all files with face count
*/

const db = await localDb();
const sourceDir = process.env.SOURCE_PATH;
if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    async (filepath: string) => updateFaceCount(db, filepath)
  );

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
