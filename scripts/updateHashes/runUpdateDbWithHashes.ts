#!/usr/bin/env node
import { log } from 'console';
import { Knex } from 'knex';
import path from 'path';
import { TABLES } from '../../src/constants.ts';
import { localDb } from '../../src/db/initDb.ts';
import { isPic } from '../../src/guards.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { getExifData } from '../lib/exif.ts';
import { genFileHash } from '../lib/hash.ts';
/*
 Read all files and update the images table with a sha 256 hash of the file
 - also adds orientation and camera model
*/

const db = await localDb();
const sourceDir = process.env.SOURCE_PATH;
if (!sourceDir) {
  throw new Error('Need source dir');
}

export const updateHashOrientationModel = async (db: Knex, filepath: string) => {
  let orientation = null;
  let model = null;
  let hash = null;

  const filename = path.basename(filepath);

  if (isPic(filename)) {
    const exif = await getExifData(filepath)
    orientation = exif.orientation
    model = exif.orientation
  }

  // no guard for videos - just generate hashes for all other files
  hash = await genFileHash(filepath)

  const trx = await db.transaction();

  try {
    await trx(TABLES.MEDIA).where('path', filepath).update({ hash, orientation, model });
    log(`INGEST::HASH_ORIENTATION_MODEL ${filepath} ${hash}, ${orientation}, ${model}`);
    await trx.commit();
  } catch (error: any) {
    log(`INGEST::HASH_ORIENTATION_MODEL_ERROR: ${error.message}`)
    await trx.rollback();
  }
}

(async () => {
  await recursiveTraverseDir(
    sourceDir,
    async (filepath: string) => updateHashOrientationModel(db, filepath)
  );

  process.exit();
})();

