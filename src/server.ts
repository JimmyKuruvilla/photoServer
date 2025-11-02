#!/usr/bin/env node
import { app } from './app.ts';
import { ONE_DAY_SECS, port } from './constants.ts';
import { setIdRange, } from './db.ts';
import { getDb } from './db/initDb.ts';

const db = await getDb();

try {
  await setIdRange(db);
  setInterval(setIdRange, ONE_DAY_SECS * 1000)
  app.listen(port);
  console.log(`SERVER_START: Listening on port ${port}`)
} catch (error: any) {
  console.error(`Error in setIdRange ${error.message}`);
}