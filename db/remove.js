#!/usr/bin/env node

const { localDb } = require('./initDb.js');
const db = localDb();
const fs = require('fs');

async function deleteByPath(filepath) {
  console.log(filepath);
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath).delete();
  console.log(dbResult);
  return trx.commit();
}

(async () => {
  fs.readFileSync(process.argv[2], 'utf-8').split(/\r?\n/).forEach(async (line) => {
    // await deleteByPath(line);
    const s = await db.raw(`delete from images where path='${line}';`)
    console.log(`delete from images where path='${line}';`)
  });
  // process.exit();
})();