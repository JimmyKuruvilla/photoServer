#!/usr/bin/env node
import { app } from './app.ts';
import { ONE_DAY_SECS, ONE_HOUR_SECS, port } from './constants.ts';
import { setIdRange, } from './db.ts';
import { getDb } from './db/initDb.ts';
import { createLogger } from './libs/pinologger.ts';

import { DirListingCache } from './services/media.ts';
const log = createLogger('SERVER')
const db = await getDb();

try {
  await setIdRange(db);
  setInterval(setIdRange, ONE_DAY_SECS * 1000)
  setInterval(() => {
    log.info(`CLEARING_DIR_LISTING_CACHE of ${DirListingCache.size} items`)
    DirListingCache.clear()
  }, ONE_HOUR_SECS * 1000)

  app.listen(port);
  log.info(`START: Listening at http://localhost:${port}`)
} catch (error: any) {
  log.error(`Error in setIdRange ${error.message}`);
}