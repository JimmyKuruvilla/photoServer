#!/usr/bin/env node
import { log } from 'console';
import { Knex } from 'knex';
import path from 'path';
import { COLS, IMAGE, TABLES, VIDEO } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { isImage, isVideo } from '../../src/guards.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
/*
 Read all files and update the media table with media_type: 'image' | 'video'
*/

const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;
if (!sourceDir) {
  throw new Error('Need source dir');
}

export const updateMediaType = async (db: Knex, filepath: string) => {
  const filename = path.basename(filepath);
  const mediaType = isImage(filename) ? IMAGE : isVideo(filename) ? VIDEO : null;
  const trx = await db.transaction();

  try {
    await trx(TABLES.MEDIA).where('path', filepath).update({ [COLS.MEDIA.MEDIA_TYPE]: mediaType });
    log(`INGEST::MEDIA_TYPE ${mediaType} ${filepath}`);
    await trx.commit();
  } catch (error: any) {
    log(`INGEST::MEDIA_TYPE: ${error.message}`)
    await trx.rollback();
  }
}

(async () => {
  await recursiveTraverseDir(
    sourceDir,
    async (filepath: string) => updateMediaType(db, filepath)
  );

  process.exit();
})();

