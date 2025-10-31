#!/usr/bin/env node
import { Knex } from 'knex';
import { TABLES } from '../../src/constants.ts';
import { localDb } from '../../src/db/initDb.ts';
import { isPic } from '../../src/guards.ts';
import { updateFaceCount } from './faces.ts';
import { updateHashOrientationModel } from './hash.ts';
import { log } from './log.ts';
import { genB64Thumbnail, logThumbnail } from './thumbnail.ts';

const db = await localDb();

// TODO: change to an upsert, gather all data first, then upsert once
export async function ingest(filepath: string) {
  const trx = await db.transaction();
  const dbResult = await trx(TABLES.MEDIA).where('path', filepath);

  if (dbResult.length === 0) {
    log(`INGEST::INSERT_IF_NOT_EXISTS ${filepath}`);
    await insertRowIfNotExists(trx, filepath);
  } else {
    log(`INGEST::UPDATE_THUMBNAIL_IF_NOT_EXISTS ${filepath}`);
    await updateThumbnailIfNotExists(trx, filepath, dbResult);
  }

  await updateFaceCount(db, filepath);
  await updateHashOrientationModel(db, filepath);
}

async function insertRowIfNotExists(trx: Knex.Transaction, filepath: string) {
  let thumbnail;
  if (isPic(filepath)) {
    thumbnail = await genB64Thumbnail(filepath);
  }

  try {
    await trx(TABLES.MEDIA).insert({ path: filepath, thumbnail });
    await trx.commit();
    log(`INGEST::INSERT: ${filepath}`)
    logThumbnail(filepath, thumbnail!);
  } catch (e) {
    log(`INGEST::INSERT_ERROR no DB match: error: ${e}`);
    await trx.rollback();
  }
}

async function updateThumbnailIfNotExists(trx: Knex.Transaction, filepath: string, dbResult: any) {
  if (isPic(filepath) && dbResult[0] && !dbResult[0].thumbnail) {
    const thumbnail = await genB64Thumbnail(filepath);
    try {
      if (thumbnail) {
        await trx(TABLES.MEDIA).where('path', filepath).update({ thumbnail });
        logThumbnail(filepath, thumbnail);
      }
      await trx.commit();
    } catch (e) {
      log(`INGEST::THUMBNAIL_ERROR: error: ${e}`);
      await trx.rollback();
    }
  }
  else {
    await trx.commit();
  }
}

