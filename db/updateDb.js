#!/usr/bin/env node

const { recursiveTraverseDir } = require('../src/listings');
const { localDb } = require('./initDb.js');

const db = localDb();

async function insertFilePathIntoDb(filepath) {
  const trx = await db.transaction();
  console.log(filepath);
  // enhancement: should really not insert every single one separately, should batch insert
  // knex.batchInsert('TableName', rows, chunkSize)
  try {
    await trx('images').insert({
      path: filepath
    });
    trx.commit();
  } catch (e) {
    console.log(e.detail);
    trx.rollback();
  }
}

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    insertFilePathIntoDb
  );
  console.log(count);
  process.exit();
})();
