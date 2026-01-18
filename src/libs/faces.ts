#!/usr/bin/env node
import child_process from 'child_process';
import { log } from 'console';
import { createDataUriFromFilePath } from './file.ts';
import { callModelWithImageInput, Prompts } from './models.ts';
const spawn = child_process.spawnSync;

const FACE_DETECTION_SCRIPT_PATH = './python/mediapipe_face.py'
const VENV_PYTHON = './python/venv/bin/python3'

/**
 * const numfaces = await countFaces('/mnt/backup/media/2006-10-22/jimm.jpg')
 * log(numfaces)
 * Count the number of faces by calling out to mediapipe with python
*/
export const old_countFaces = async (filepath: string) => {
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

/**
 * Use network llm vision model for face detection
 */
type CountFacesOptions = {
  b64?: string, filepath?: string
}
export const countFaces = async (options: CountFacesOptions) => {
  try {
    if (!options.b64 && !options.filepath) {
      throw new Error(`COUNT_FACES__MUST_PASS_ONE_INPUT_STRING: ${options}`)
    }

    const dataUrl = options.filepath ? await createDataUriFromFilePath(options.filepath!) : options.b64!
    const modelRespData = await callModelWithImageInput({
      dataUrl,
      prompt: Prompts.NumFacesPrompt,
      modelName: undefined,
      modelOrigin: 'http://192.168.2.156:1234', //jwind
    })

    try {
      const numFaces = JSON.parse(modelRespData.output[0].content[0].text).faces
      return numFaces
    } catch (error) {
      log(`COUNT_FACES_JSON_PARSE_ERROR`)
      throw error
    }
  } catch (error: any) {
    log(`COUNT_FACES_ERROR: ${error.message}`, { cause: error })
    return 0
  }
}