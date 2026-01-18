#!/usr/bin/env node
import { Knex } from 'knex';
import { TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { isImage } from '../../src/guards.ts';
import { countFaces } from '../../src/libs/faces.ts';
import { log } from '../../src/libs/log.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
/*
 SOURCE_PATH=/mnt/backup/media tsx ./scripts/updateFaces/runUpdateDbWithModelFaces.ts
 TEST: SOURCE_PATH=/home/j/scripts/photoServer/scripts/testfiles tsx ./scripts/updateFaces/runUpdateDbWithModelFaces.ts
 Updates all files with face count
*/

const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;

export const updateFaceCount = async (db: Knex, filepath: string) => {
  let numFaces;

  log(`RECORD_PATH: ${filepath}`)
  if (!isImage(filepath)) {
    log(`FACES::SKIPPING_FILE__NOT_AN_IMAGE: ${filepath}`);
    return
  }

  try {
    const records = await db(TABLES.MEDIA).where('path', filepath)
    const record = records[0]

    if (record?.thumbnail) {
      numFaces = await countFaces({ b64: record.thumbnail })
      log(`FACE_COUNT: ${record.face_count}`)
    } else {
      log(`FACES::SKIPPING_FILE__NO_THUMBNAIL: ${filepath}`);
      return
    }
  } catch (error: any) {
    log(`FACES::SKIPPING_FILE ${error.message}`);
    return
  }

  const trx = await db.transaction();
  try {
    await trx(TABLES.MEDIA).where('path', filepath).update({ face_count: numFaces });
    await trx.commit();
    log(`FACES::${filepath} numFaces: ${numFaces}`)
  } catch (error: any) {
    await trx.rollback();
    log(`FACES::ERROR ${error.message}`);
  }
}

if (!sourceDir) {
  throw new Error('Need source dir');
}

(async () => {
  const count = await recursiveTraverseDir(
    sourceDir,
    async (filepath: string) => updateFaceCount(db, filepath)
  );

  const size = await db.raw(`SELECT pg_size_pretty(pg_total_relation_size('${TABLES.MEDIA}'));`)
  console.log(count, size);
  process.exit();
})();
