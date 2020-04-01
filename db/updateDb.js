#!/usr/bin/env node
const imageThumbnail = require('image-thumbnail');
const { recursiveTraverseDir } = require('../src/listings');
const { localDb } = require('./initDb.js');
const { isPic } = require('../src/guards');
const db = localDb();

async function update(filepath) {
  console.log(filepath);
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath);

  if (dbResult.length === 0) {
    _insertRowIfNotExists(trx, filepath);
  } else {
    _updateThumbnailIfNotExists(trx, filepath, dbResult);
  }

}

async function _insertRowIfNotExists(trx, filepath) {
  let thumbnail;
  if (isPic(filepath)) {
    thumbnail = await _getThumbnail(filepath);
  }

  try {
    await trx('images').insert({ path: filepath, thumbnail });
    await trx.commit();
    console.log(`path inserted: ${filepath}`)
    _logThumbnail(filepath, thumbnail);
  } catch (e) {
    console.log(`No DB match: error: ${e}`);
    await trx.rollback();
  }
}

async function _updateThumbnailIfNotExists(trx, filepath, dbResult) {
  if (isPic(filepath) && dbResult[0] && !dbResult[0].thumbnail) {
    const thumbnail = await _getThumbnail(filepath);
    try {
      await trx('images').where('path', filepath).update({ thumbnail });
      _logThumbnail(filepath, thumbnail);
      await trx.commit();
    } catch (e) {
      console.log(`DB matched: error: ${e}`);
      await trx.rollback();
    }
  } else {
    await trx.commit();
  }
}

async function _getThumbnail(fullPath, options = { percentage: 10, responseType: 'base64', jpegOptions: { force: true, quality: 20 } }) {
  try {
    thumbnail = 'data:image/png;base64,';
    thumbnail += await imageThumbnail(fullPath, options);
    return thumbnail;
  } catch (e) {
    console.log(`thumbnail generation error: ${e}`);
    return;
  }
}

const _logThumbnail = (filepath, thumbnail) => {
  if (isPic(filepath)) { console.log(`thumbnail updated: ${thumbnail.slice(-50)}`); }
}

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    update
  );
  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();