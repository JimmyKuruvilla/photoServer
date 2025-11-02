#!/usr/bin/env node
import { log } from 'node:console';
import { localDb } from '../../src/db/initDb.ts';
import { COLS, TABLES } from '../constants.ts';
import { isMedia, isPic } from '../guards.ts';
import { getExifData } from '../libs/exif.ts';
import { countFaces, } from '../libs/faces.ts';
import { genFileHash, } from '../libs/hash.ts';
import { genB64Thumbnail } from '../libs/thumbnail.ts';

/*
Sample Data 
[[{
  "id":55004,
  "created_at":"2025-08-14 21:52:00.563431+00",

  // all nullable
  "path":"/mnt/backup/media/01-02-2012/IMG_5461.JPG",
  "thumbnail":"data:image/png;base64,1234567",
  "face_count":1,
  "hash":"bfb6b3189ccfda580aa63216a9d051925d3d39fe7b0d1ce6a72be501df042a98",
  "orientation":6,
  "model":"Canon PowerShot SD1000"
}] 
*/
const db = await localDb();

export async function ingest(filepath: string) {
  const record: Record<string, string | null | number> = {
    path: null,
    hash: null,
    orientation: null,
    model: null,
    thumbnail: null,
    face_count: 0,
  }

  const isDenyListed = (await db(TABLES.DELETED).where(COLS.DELETED.HASH, record.hash).limit(1)).length > 0;

  if (isDenyListed) {
    log(`INGEST::SKIPPING_PERMA_DELETED_HASH ${filepath}`)
    return
  } else {
    if (isMedia(filepath)) {
      record.path = filepath
      record.hash = await genFileHash(filepath)

      if (isPic(filepath)) {
        const exif = await getExifData(filepath)
        record.orientation = exif.orientation
        record.model = exif.model
        record.thumbnail = await genB64Thumbnail(filepath)
        record.face_count = await countFaces(filepath)
      }
    }

    /**
     * Knex/PG requires a unique index on the columns to use an upsert with onConflict
     * https://knexjs.org/guide/query-builder.html#onconflict
     */
    const isNotInDb = (await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, filepath)).length === 0;
    if (isNotInDb) {
      try {
        log(`INGEST::INSERT_RECORD ${filepath}`);
        await db(TABLES.MEDIA).insert(record);
      } catch (error) {
        log(`INGEST::INSERT_ERROR ${error}`);
      }
    } else {
      try {
        log(`INGEST::UPDATE_RECORD ${filepath}`);
        await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, filepath).update(record);
      } catch (error) {
        log(`INGEST::UPDATE_ERROR ${error}`);
      }
    }
  }
}