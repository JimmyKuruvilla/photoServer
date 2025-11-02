#!/usr/bin/env node
import { unlink } from 'fs/promises';
import { TABLES } from '../../src/constants.ts';
import { getMarkedFromDb } from '../../src/db.ts';
import { localDb } from '../../src/db/initDb.ts';
import { log } from '../../src/libs/log.ts';

/*
  - get all media with marked tag
  - insert hashes into deleted table
  - delete from disk
  - delete from db
  - [OPTIONAL, MANUAL] delete from s3 by running ~/scripts/deleteSyncToS3 script
*/

const db = await localDb();

(async () => {
  const records = await getMarkedFromDb(db) // id and media_id are both the media.id

  for await (const record of records) {
    const trx = await db.transaction();
    try {
      console.log(record.path);
      await trx(TABLES.DELETED).insert({ hash: record.hash, path: record.path })
      await trx(TABLES.MEDIA).where('id', record.media_id).delete()
      await unlink(record.path)
      trx.commit();
    } catch (error: any) {
      trx.rollback();
      log(`ERROR: ${error.message}`)
    }
  }
  process.exit();
})();