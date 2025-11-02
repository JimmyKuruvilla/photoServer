#!/usr/bin/env node
import child_process from 'child_process';
const spawn = child_process.spawnSync;

const FACE_DETECTION_SCRIPT_PATH = './python/mediapipe_face.py'
const VENV_PYTHON = './python/venv/bin/python3'

/**
 * const numfaces = await countFaces('/mnt/backup/media/2006-10-22/jimm.jpg')
 * log(numfaces)
 * Count the number of faces by calling out to mediapipe with python
*/
export const countFaces = async (filepath: string) => {
  const child = spawn(VENV_PYTHON, [FACE_DETECTION_SCRIPT_PATH, filepath], {})
  const stdout = child.stdout.toString()
  const stderr = child.stderr.toString()

  try {
    const numFaces = parseInt(stdout, 10)
    return isNaN(numFaces) ? 0 : numFaces
  } catch (error) {
    throw new Error(`COUNT_FACES_ERROR from python: ${stderr}`, { cause: error })
  }
}