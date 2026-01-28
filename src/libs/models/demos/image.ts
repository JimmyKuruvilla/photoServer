import { argv, exit } from 'process';
import { createDataUriFromFilePath } from '../../file.ts';
import { createDataUriFromImageUrl } from '../../image.ts';
import { JWIND_ORIGIN } from '../constants.ts';
import { callModel } from '../models.ts';
import { Prompts } from '../prompts.ts';
import { createLogger } from '../../pinologger.ts';
import { logModelResponse } from '../utils.ts';
const log = createLogger('image')

/**
 * Used to run the script as standalone from a file or a web url, can also be a FE fileView url
 */
const image = async () => {
  const [, , url] = argv;

  try {
    console.time('datauri')
    const dataUriFn = url.includes('http') ? createDataUriFromImageUrl : createDataUriFromFilePath
    const dataUrl = await dataUriFn(url);
    console.timeEnd('datauri')

    console.time('callmodel')
    const modelRespData = await callModel({
      modelName: undefined,
      modelOrigin: JWIND_ORIGIN,
      prompt: Prompts.GeneralStructuredImagePrompt,
      dataUrl
    })
    console.timeEnd('callmodel')

    await logModelResponse(modelRespData, log)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    exit(1);
  }
};

// image()