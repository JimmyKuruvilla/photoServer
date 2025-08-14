#!/usr/bin/env node
import child_process from 'child_process'
import { Knex } from 'knex'
import util from 'util'
const exec = util.promisify(child_process.exec)

const FACE_DETECTION_SCRIPT_PATH = './python/mediapipe_face.py'

const countFaces = async (filepath: string) => {
  const { stdout, stderr } = await exec(`python3 ${FACE_DETECTION_SCRIPT_PATH} "${filepath}"`)

  try {
    const numFaces = parseInt(stdout, 10)
    return numFaces
  } catch (error) {
    throw new Error(`COUNT_FACES_ERROR from python: ${stderr}`, { cause: error })
  }
}

export const updateFaceCount = async (db: Knex, filepath: string) => {
  const trx = await db.transaction();

  let numFaces;

  try {
    numFaces = await countFaces(filepath)
  } catch (error: any) {
    await trx.rollback();
    if (error.message.includes('Image decoding failed (unknown image type)')) {
      console.warn(`PIPELINE::FACES_SKIPPING_FILE ${filepath}`);
      return
    } else {
      console.error(`PIPELINE::FACES_PYTHON_ERROR ${error.message}`);
      return
    }
  }

  try {
    await trx('images').where('path', filepath).update({ face_count: numFaces });
    await trx.commit();
    console.log(`PIPELINE::FACES ${filepath} numFaces: ${numFaces}`)
  } catch (error: any) {
    console.error(`PIPELINE::FACES_ERROR ${error.message}`);
  }
}