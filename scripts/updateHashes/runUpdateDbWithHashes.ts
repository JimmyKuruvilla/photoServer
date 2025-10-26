#!/usr/bin/env node
import { localDb } from '../../src/db/initDb.ts';
import { recursiveTraverseDir } from '../../src/libs/file/recursiveTraverseDir.ts';
import { updateHashOrientationModel } from '../lib/hash.ts';
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
    async (filepath: string) => updateHashOrientationModel(db, filepath)
  );

  process.exit();
})();

