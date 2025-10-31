import crypto from 'crypto';
import { Knex } from 'knex';
import fs from 'node:fs';
import path from 'node:path';
import { TABLES } from '../../src/constants.ts';
import { isPic } from '../../src/guards.ts';
import { getExifData } from './exif.ts';
import { log } from './log.ts';

export const genFileHash = async (filepath: string, algorithm = 'sha256', encoding = 'hex'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hasher = crypto.createHash(algorithm);
    const file = fs.createReadStream(filepath);

    file.on('error', err => {
      reject(err);
    });

    file.pipe(hasher);

    hasher.on('finish', () => {
      resolve(hasher.read().toString(encoding));
    });
  });
}

export const updateHashOrientationModel = async (db: Knex, filepath: string) => {
  let orientation = null;
  let model = null;
  let hash = null;

  const filename = path.basename(filepath);

  if (isPic(filename)) {
    const tags = await getExifData(filepath)
    model = tags?.Model?.description ?? null
    orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : orientation
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