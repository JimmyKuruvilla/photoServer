#!/usr/bin/env node
import child_process from 'child_process'
import { Knex } from 'knex'
import util from 'util'
import { log } from './log.ts'
const spawn = child_process.spawnSync;

const FACE_DETECTION_SCRIPT_PATH = './python/mediapipe_face.py'
const VENV_PYTHON = './python/venv/bin/python3'

/**
 * const numfaces = await countFaces('/mnt/backup/media/2006-10-22/jimm.jpg')
 * log(numfaces)
 * Count the number of faces by calling out to mediapipe with python
*/
const countFaces = async (filepath: string) => {
  const child = spawn(VENV_PYTHON, [FACE_DETECTION_SCRIPT_PATH, filepath], {})
  const stdout = child.stdout.toString()
  const stderr = child.stderr.toString()

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
      log(`PIPELINE::FACES_SKIPPING_FILE ${filepath}`);
      return
    } else {
      log(`PIPELINE::FACES_PYTHON_ERROR ${error.message}`);
      return
    }
  }

  try {
    await trx('images').where('path', filepath).update({ face_count: numFaces });
    await trx.commit();
    log(`PIPELINE::FACES ${filepath} numFaces: ${numFaces}`)
  } catch (error: any) {
    log(`PIPELINE::FACES_ERROR ${error.message}`);
  }
}