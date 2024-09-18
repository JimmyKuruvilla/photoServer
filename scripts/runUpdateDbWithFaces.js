#!/usr/bin/env node
const { recursiveTraverseDir } = require('../src/listings.js');
const { localDb } = require('../db/initDb.js');
const { updateFaceCount } = require('./faces.js');
/*
 cd ~/scripts/photoServer
 source ./python/venv/bin/activate
 node ./scripts/runUpdateDbWithFaces.js /mnt/backup/media
*/

const db = localDb();

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    async (filepath) => updateFaceCount(db, filepath)
  );

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
