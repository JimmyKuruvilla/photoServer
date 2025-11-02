#!/usr/bin/env node
import { Knex } from 'knex';
import { TABLES } from '../../src/constants.ts';
import { getDb } from '../../src/db/initDb.ts';
import { countFaces } from '../../src/libs/faces.ts';
import { log } from '../../src/libs/log.ts';
import { recursiveTraverseDir } from '../../src/libs/recursiveTraverseDir.ts';
/*
 cd ~/scripts/photoServer
 source ./python/venv/bin/activate
 SOURCE_PATH=/mnt/backup/media tsx ./scripts/updateFaces/runUpdateDbWithFaces.ts
 Updates all files with face count
*/

const db = await getDb();
const sourceDir = process.env.SOURCE_PATH;

export const updateFaceCount = async (db: Knex, filepath: string) => {
  const trx = await db.transaction();

  let numFaces;

  try {
    numFaces = await countFaces(filepath)
  } catch (error: any) {
    await trx.rollback();
    if (error.message.includes('Image decoding failed (unknown image type)')) {
      log(`FACES::SKIPPING_FILE ${filepath}`);
      return
    } else {
      log(`FACES::PYTHON_ERROR ${error.message}`);
      return
    }
  }

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

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size(${TABLES.MEDIA}) );`)
  console.log(count, size);
  process.exit();
})();
