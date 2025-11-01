#!/usr/bin/env node
import { Knex } from 'knex';
import { log } from 'node:console';
import { updateFaceCount } from '../../scripts/lib/faces.ts';
import { genFileHash, updateHashOrientationModel } from '../../scripts/lib/hash.ts';
import { genB64Thumbnail, logThumbnail } from '../../scripts/lib/thumbnail.ts';
import { localDb } from '../../src/db/initDb.ts';
import { COLS, TABLES } from '../constants.ts';
import { isPic } from '../guards.ts';


const db = await localDb();

// TODO: change to an upsert, gather all data first, then upsert once
// extract fns to get the data
// then get all teh data in one go, then do an 
export async function ingest(filepath: string) {
  const trx = await db.transaction();
  const hash = await genFileHash(filepath)
  const isDenyListed = (await trx(TABLES.DELETED).where(COLS.DELETED.HASH, hash).limit(1)).length > 0;
  if (isDenyListed) {
    log(`INGEST::SKIPPING_PERMA_DELETED_HASH ${filepath}`)
    return
  }

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

