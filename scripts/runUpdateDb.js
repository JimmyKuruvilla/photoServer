#!/usr/bin/env node
const { recursiveTraverseDir } = require('../src/listings');
const { localDb } = require('../db/initDb.js');
const { createOrUpdateFromFilePath } = require('./updateDb');

const db = localDb();

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    createOrUpdateFromFilePath
  );
  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
