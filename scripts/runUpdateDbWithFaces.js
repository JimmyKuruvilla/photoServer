#!/usr/bin/env node
const { recursiveTraverseDir } = require('../src/listings.js');
const { localDb } = require('../db/initDb.js');
const { createOrUpdateFromFilePath } = require('./updateDb.js');
const child_process = require('child_process')
const util = require('util');
const exec = util.promisify(child_process.exec)
/*
 cd ~/scripts/photoServer
 source ./python/venv/bin/activate
 node ./scripts/runUpdateDbWithFaces.js /mnt/backup/media

 1. commit result
 2. install venv python
 3. install mediapipe
 4. generate requirements file
 5. does it work on restart?
 7.5 add column for faces detected. 
 6. run general script << -----
 -- fails on file paths with spaces and ( ). How to fix?
 7. run on drop processor
 8. test out vite and include number of faces detected in query result. 
*/

const db = localDb();

const FACE_DETECTION_SCRIPT_PATH = './python/mediapipe_face.py'
const countFaces = async (filepath) => {
  const { stdout, stderr } = await exec(`python3 ${FACE_DETECTION_SCRIPT_PATH} ${filepath}`)

  try {
    const numFaces = parseInt(stdout, 10)
    return numFaces
  } catch (error) {
    throw new Error(`COUNT_FACES_ERROR from python: ${stderr}`, { cause: error })
  }
}

(async () => {
  const count = await recursiveTraverseDir(
    process.argv[2] || __dirname,
    async (filepath) => {
      const trx = await db.transaction();
      
      let numFaces;

      try {
        numFaces = await countFaces(filepath)
      } catch (error) {
        await trx.rollback();
        if (error.message.includes('Image decoding failed (unknown image type)')) {
          console.warn(`SKIPPING_FILE ${filepath}`);
          return
        } else {
          console.error(`PYTHON_ERROR error: ${error.message}`);
          return
        }
      }

      try {
        await trx('images').where('path', filepath).update({ face_count: numFaces });
        await trx.commit();
        console.log(`DB_UPDATE path: ${filepath}, numFaces: ${numFaces}`)
      } catch (error) {
        console.error(`DB_UPDATE_ERROR error: ${error.message}`);
      }
    }
  );

  const size = await db.raw(`SELECT pg_size_pretty( pg_total_relation_size('images') );`)
  console.log(count, size);
  process.exit();
})();
