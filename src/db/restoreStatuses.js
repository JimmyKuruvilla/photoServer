#!/usr/bin/env node

const { localDb } = require('./initDb.js');
const db = localDb();
const fs = require('fs');

async function restoreFavorites(filepath) {
  console.log(`favorite - working on ${filepath}`);
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath).update({ "favorite": true });
  console.log(`db returned ${dbResult}`);
  return trx.commit();
}

async function restoreMarked(filepath) {
  console.log(`marked - working on ${filepath}`);
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath).update({ "marked": true });
  console.log(`db returned ${dbResult}`);
  return trx.commit();
}

(async () => {
  await fs.readFileSync(process.argv[2], 'utf-8').split(/\r?\n/).forEach(async (line) => {
    // await restoreFavorites(line);
    await restoreMarked(line);
  });
  // process.exit();
})();