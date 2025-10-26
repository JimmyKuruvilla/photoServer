#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { localDb } from '../../src/db/initDb.ts';
import { isPic, isVideo } from '../../src/guards.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { getExifData } from '../lib/exif.ts';
import { genFileHash } from '../lib/hash.ts';
import { log } from '../lib/log.ts';
const readFile = fs.readFile;
/*
 Read all files and update the images table with a sha 256 hash of the file
 - also adds orientation and camera model
*/

const db = await localDb();
const sourceDir = process.env.SOURCE_PATH;
if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  await recursiveTraverseDir(
    sourceDir,
    async (filepath: string) => {
      let orientation = null;
      let model = null;
      let hash = null;

      const filename = path.basename(filepath);

      try {

        if (isPic(filename)) {
          hash = await genFileHash(filepath)
          const tags = await getExifData(filepath)
          model = tags?.Model?.description ?? null
          orientation = tags?.Orientation?.value ? Number(tags?.Orientation?.value) : orientation
          await saveToDb(filepath, hash, orientation, model)
        } else if (isVideo(filename)) {
          hash = await genFileHash(filepath)
          await saveToDb(filepath, hash, orientation, model)
        }
      } catch (error: any) {
        log(`ERROR: ${error.message}`)
      }
    }
  );

  process.exit();
})();

const saveToDb = async (filepath: string, hash: string | null, orientation: number | null, model: string | null) => {
  const trx = await db.transaction();

  try {
    await trx('images').where('path', filepath).update({ hash, orientation, model });
    await trx.commit();
    log(`Processed ${filepath}`);
  } catch (error: any) {
    log(`${error.message}`);
  }
}
/**
 * 1. add migration to add new fields :DONE
 * 2. write script to ingest :DONE
 * 3. update processor code with changes
 * 4. test the files
 */