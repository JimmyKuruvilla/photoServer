#!/usr/bin/env node
import imageThumbnail from '../src/libs/image-thumbnail/image-thumbnail';
import { localDb } from '../src/db/initDb';
import { isPic } from '../src/guards';
import { updateFaceCount } from './faces';
import { log } from './log.js';

const db = await localDb();

export async function createOrUpdateFromFilePath(filepath) {
  const trx = await db.transaction();
  const dbResult = await trx('images').where('path', filepath);

  if (dbResult.length === 0) {
    log(`PIPELINE_INSERT_IF_NOT_EXISTS ${filepath}`);
    await _insertRowIfNotExists(trx, filepath);
  } else {
    log(`PIPELINE_UPDATE_THUMBNAIL_IF_NOT_EXISTS ${filepath}`);
    await _updateThumbnailIfNotExists(trx, filepath, dbResult);
  }

  await updateFaceCount(db, filepath);
}

async function _insertRowIfNotExists(trx, filepath) {
  let thumbnail;
  if (isPic(filepath)) {
    thumbnail = await _getThumbnail(filepath);
  }

  try {
    await trx('images').insert({ path: filepath, thumbnail });
    await trx.commit();
    log(`PIPELINE_INSERT: ${filepath}`)
    _logThumbnail(filepath, thumbnail);
  } catch (e) {
    log(`PIPELINE_INSERT_ERROR no DB match: error: ${e}`);
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
      log(`PIPELINE_THUMBNAIL_ERROR: error: ${e}`);
      await trx.rollback();
    }
  }
  else {
    await trx.commit();
  }
}

async function _getThumbnail(fullPath, options = { percentage: 10, responseType: 'base64', jpegOptions: { force: false, quality: 20 } }) {
  try {
    let thumbnail = 'data:image/png;base64,';
    thumbnail += await imageThumbnail(fullPath, options as any);
    return thumbnail;
  } catch (e) {
    log(`PIPELINE_ERROR thumbnail generation: ${e}`);
    return;
  }
}

const _logThumbnail = (filepath, thumbnail) => {
  if (isPic(filepath)) { log(`PIPELINE_THUMBNAIL ${thumbnail.slice(-50)}`); }
}
