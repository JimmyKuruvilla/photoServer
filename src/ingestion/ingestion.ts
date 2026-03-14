#!/usr/bin/env node

import path from 'path';
import { COLS, IMAGE, TABLES, TRASHED_PREFIX, VIDEO } from '../constants.ts';
import { DbMediaWithTags } from '../db.ts';
import { getDb } from '../db/initDb.ts';
import { isImage, isIngestable, isVideo } from '../guards.ts';
import { getMediaCaptureDate } from '../libs/creationTime.ts';
import { isInDenyList, isNotInDb } from '../libs/dbGuards.ts';
import { getExifData } from '../libs/exif.ts';
import { genFileHash, } from '../libs/hash.ts';
import { getImageDescriptors } from '../libs/imageDescriptors.ts';
import { copyToTarget, deleteTarget } from '../libs/file.ts';
import { generateTargetPath } from '../libs/path.ts';
import { createLogger } from '../libs/pinologger.ts';
import { genB64Thumbnail } from '../libs/thumbnail.ts';
import { Nullable } from '../types/types.ts';
const log = createLogger('[INGEST]');

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
export async function ingest(sourceFilePath: string, targetPath: string, opts = { shouldMove: false, shouldAI: false }) {
  let cleanupSourcePath;
  let cleanupTargetPath;

  try {
    const record: Nullable<Partial<DbMediaWithTags>> = {
      path: null,
      hash: null,
      orientation: null,
      model: null,
      thumbnail: null,
      face_count: 0,
      media_type: null,
      metadata: null,
      captured_at: null
    }

    const filename = path.basename(sourceFilePath);
    const ext = path.extname(sourceFilePath)

    // isIngestable also checks trashed files, but this also deletes them. 
    if (filename.startsWith(TRASHED_PREFIX)) {
      log.warn(`DELETING_TRASHED_FILE (.trashed) ${filename}`);
      await deleteTarget(sourceFilePath)
      return
    }

    if (!isIngestable({ filePath: sourceFilePath, log })) {
      return
    }

    record.hash = await genFileHash(sourceFilePath)

    const isDenyListed = await isInDenyList(db, record.hash)
    if (isDenyListed) {
      log.warn(`SKIPPING_DENY_LISTED_HASH ${sourceFilePath}, ${record.hash}`)
      return
    } else {
      log.debug(`${sourceFilePath}`)
      const capturedAt = await getMediaCaptureDate(sourceFilePath)
      record.captured_at = capturedAt

      if (opts.shouldMove) {
        const { targetFolderName, targetFilePath } = generateTargetPath(sourceFilePath, targetPath, capturedAt)
        const copiedFilePath = await copyToTarget(sourceFilePath, targetPath, targetFolderName!, targetFilePath!)
        record.path = copiedFilePath

        cleanupSourcePath = sourceFilePath
        cleanupTargetPath = copiedFilePath
      } else {
        record.path = sourceFilePath
      }

      record.media_type = isImage(record.path) ? IMAGE : isVideo(record.path) ? VIDEO : null
      if (isImage(record.path)) {
        record.thumbnail = await genB64Thumbnail(record.path)
        if (opts.shouldAI) {
          record.metadata = record.thumbnail ? await getImageDescriptors({ b64: record.thumbnail }) : null
          record.face_count = record.metadata?.humanCount ?? 0
        }

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
      const shouldInsert = await isNotInDb(db, record.path)

      if (shouldInsert) {
        log.info(`ATTEMPT_INSERT_RECORD ${record.path}`);
        await db(TABLES.MEDIA).insert(record);
      } else {
        log.info(`ATTEMPT_UPDATE_RECORD ${record.path}`);
        await db(TABLES.MEDIA).where(COLS.MEDIA.PATH, record.path).update(record);
      }

      if (opts.shouldMove && cleanupSourcePath) {
        try {
          await deleteTarget(cleanupSourcePath)
        } catch (error) {
          log.error(`FAILED_TO_DELETE_SOURCE ${cleanupSourcePath}`)
          log.error(error)
        }
      }
    }
  } catch (error) {
    log.error(`ERROR ${error}`)
    if (opts.shouldMove && cleanupTargetPath) {
      try {
        await deleteTarget(cleanupTargetPath)
      } catch (error) {
        log.error(`FAILED_TO_DELETE_TARGET ${cleanupTargetPath}`)
        log.error(error)
      }
    }
  }
}