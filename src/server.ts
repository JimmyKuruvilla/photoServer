#!/usr/bin/env node
import { ONE_DAY_SECS, port } from './constants.ts';
import { setIdRange, } from './db.ts';
import { localDb } from './db/initDb.ts';
import { app } from './app.ts';

const db = await localDb();

try {
  await setIdRange(db);
  setInterval(setIdRange, ONE_DAY_SECS * 1000)
  app.listen(port);
  console.log(`SERVER_START: Listening on port ${port}`)
} catch (error: any) {
  console.error(`Error in setIdRange ${error.message}`);
}