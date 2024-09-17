#!/usr/bin/env node
const imageThumbnail = require('../src/libs/image-thumbnail/image-thumbnail');
const { localDb } = require('../db/initDb.js');
const { isPic } = require('../src/guards');
const db = localDb();

async function createOrUpdateFromFilePath(filepath) {
  console.log(`DB_UPDATE ${filepath}`);
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath);

  if (dbResult.length === 0) {
    _insertRowIfNotExists(trx, filepath);
  } else {
    _updateThumbnailIfNotExists(trx, filepath, dbResult);
    // insert face detectionhere
    // update code to have trx commit and rollback in top level trycatches
    
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
    console.log(`DB_UPDATE path inserted: ${filepath}`)
    _logThumbnail(filepath, thumbnail);
  } catch (e) {
    console.log(`DB_UPDATE_ERROR no DB match: error: ${e}`);
    await trx.rollback();
  }
}

async function _updateThumbnailIfNotExists(trx, filepath, dbResult) {
  if (isPic(filepath) && dbResult[0] && !dbResult[0].thumbnail) {
    const thumbnail = await _getThumbnail(filepath);
    try {
      if (thumbnail) {
        await trx('images').where('path', filepath).update({ thumbnail });
        _logThumbnail(filepath, thumbnail);
      }
      await trx.commit();
    } catch (e) {
      console.log(`DB_UPDATE_ERROR: error: ${e}`);
      await trx.rollback();
    }
  }
  else {
    await trx.commit();
  }
}

async function _getThumbnail(fullPath, options = { percentage: 10, responseType: 'base64', jpegOptions: { force: false, quality: 20 } }) {
  try {
    thumbnail = 'data:image/png;base64,';
    thumbnail += await imageThumbnail(fullPath, options);
    return thumbnail;
  } catch (e) {
    console.log(`DB_UPDATE_ERROR thumbnail generation error: ${e}`);
    return;
  }
}

const _logThumbnail = (filepath, thumbnail) => {
  if (isPic(filepath)) { console.log(`DB_UPDATE thumbnail updated: ${thumbnail.slice(-50)}`); }
}

module.exports = {
  createOrUpdateFromFilePath
}
