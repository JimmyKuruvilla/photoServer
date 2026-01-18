#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'path';
import { COLS, TABLES } from '../constants.ts';
import { getDb } from '../db/initDb.ts';
import { isImage, isMedia, isVideo } from '../guards.ts';
import { getExifData } from '../libs/exif.ts';
import { countFaces, } from '../libs/faces.ts';
import { genFileHash, } from '../libs/hash.ts';
import { createLogger } from '../libs/log.ts';
import { moveToTarget } from '../libs/move.ts';
import { generateTargetPathForImage, generateTargetPathForVideo } from '../libs/path.ts';
import { genB64Thumbnail } from '../libs/thumbnail.ts';
import { isIgnorePath } from '../utils.ts';
const log = createLogger('INGEST');

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
const db = await getDb();

/**
 * Used from full ingestion where paths can be from media folder (vetted media files)
 * Used from dropProcessor where paths can be from drop folder (include *any* file)
 */
export async function ingest(sourceFilePath: string, targetPath: string, opts = { shouldMove: false }) {
  const record: Record<string, string | null | number> = {
    path: null,
    hash: null,
    orientation: null,
    model: null,
    thumbnail: null,
    face_count: 0,
  }

  const filename = path.basename(sourceFilePath);
  const ext = path.extname(sourceFilePath)
  const containsHiddenPath = sourceFilePath.split(path.sep).some(f => f[0] === '.')

  if (isIgnorePath(sourceFilePath)) {
    log(`SKIPPING_IGNORE_PREFIX_PATH ${sourceFilePath}`)
    return
  }

  if (containsHiddenPath) {
    log(`SKIPPING_HIDDEN_FOLDER_OR_FILE ${sourceFilePath}`);
    return
  }

  if (ext.includes('part')) {
    log(`SKIPPING_PARTIAL_UPLOAD (part) ${filename}`);
    return
  }

  if (filename.startsWith('.trashed')) {
    log(`DELETING_TRASHED_FILE (.trashed) ${filename}`);
    await fs.unlink(sourceFilePath)
    return
  }

  if (!isMedia(filename)) {
    log(`SKIPPING_NON_MEDIA_FILE ${sourceFilePath}`)
    return
  }

  try {
    record.hash = await genFileHash(sourceFilePath)
  } catch (error) {
    log(`GEN_HASH_ERROR: ${error}`)
    return
  }

  const isDenyListed = (await db(TABLES.DELETED).where(COLS.DELETED.HASH, record.hash).limit(1)).length > 0;

  if (isDenyListed) {
    log(`SKIPPING_DENY_LISTED_HASH ${sourceFilePath}`)
    return
  } else {
    let targetFolderName
    let targetFilePath

    if (opts.shouldMove) {
      if (isImage(sourceFilePath)) {
        const pathData = await generateTargetPathForImage(sourceFilePath, targetPath)
        targetFolderName = pathData.targetFolderName
        targetFilePath = pathData.targetFilePath
      } else if (isVideo(sourceFilePath)) {
        const pathData = await generateTargetPathForVideo(sourceFilePath, targetPath)
        targetFolderName = pathData.targetFolderName
        targetFilePath = pathData.targetFilePath
      }

      const movedFilePath = await moveToTarget(sourceFilePath, targetPath, targetFolderName!, targetFilePath!)
      record.path = movedFilePath
    } else {
      record.path = sourceFilePath
    }

    if (record.path) {
      if (isImage(record.path)) {
        record.thumbnail = await genB64Thumbnail(record.path)
        record.face_count = record.thumbnail ? await countFaces({ b64: record.thumbnail }) : 0
        //DEBUG log(`FACE_COUNT: ${record.path} ${record.face_count}`)

        const exif = await getExifData(record.path)
        if (exif) {
          record.orientation = exif.orientation
          record.model = exif.model
        }
      }

      /**
       * Knex/PG requires a unique index on the columns to use an upsert with onConflict
       * https://knexjs.org/guide/query-builder.html#onconflict
       */
      const isNotInDb = (await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, record.path)).length === 0;

      if (isNotInDb) {
        try {
          log(`INSERT_RECORD ${record.path}`);
          await db(TABLES.MEDIA).insert(record);
        } catch (error) {
          log(`INSERT_ERROR ${error}`);
        }
      } else {
        try {
          log(`UPDATE_RECORD ${record.path}`);
          await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, record.path).update(record);
        } catch (error) {
          log(`UPDATE_ERROR ${error}`);
        }
      }
    } else {
      return
    }
  }
}