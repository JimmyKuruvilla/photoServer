#!/usr/bin/env node
import { app } from './app.ts';
import { ONE_DAY_SECS, port } from './constants.ts';
import { setIdRange, } from './db.ts';
import { getDb } from './db/initDb.ts';
import { createLogger } from './libs/log.ts';
const log = createLogger('SERVER')
const db = await getDb();

try {
  await setIdRange(db);
  setInterval(setIdRange, ONE_DAY_SECS * 1000)
  app.listen(port);
  log(`SERVER_START: Listening on port ${port}`)
} catch (error: any) {
  log(`Error in setIdRange ${error.message}`);
}