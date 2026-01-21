import { argv, exit } from 'process';
import { createDataUriFromFilePath } from './file.ts';
import { createDataUriFromImageUrl } from './image.ts';
/**
 * jubuntus holds all data and ingests new photos
 * jwind holds the models and has the gpu to process images
 * jubuntus sends a request to jwind for structured response data and stores that it its db

 * ideas:
 * 1. let the llm create tags that are searchable in the UI
 * 2. let the llm detect faces and store that data per image in the db
 * 3. give the llm a tool to talk to the db over http and make queries to find similar images
 */


type ModelCallOptions = {
  dataUrl: string;
  prompt: string;
  modelName?: string;
  modelOrigin?: string;
}

type ModelResponseOutputContent = {
  annotations: any[]
  logprobs: any[]
  text: string
  type: string // 'output_text'
}

type ModelResponseOutput = {
  id: string
  type: string // 'message'
  role: string // 'assistant'
  status: string // 'completed'
  content: ModelResponseOutputContent[]
}

type ModelResponse = {
  // ...bunch of props
  object: string
  status: string
  model: string
  output: ModelResponseOutput[]
}

export const callModelWithImageInput = async (options: ModelCallOptions): Promise<ModelResponse> => {
  const modelName = options.modelName ?? 'qwen/qwen3-vl-4b'
  const modelOrigin = options.modelOrigin ?? 'http://localhost:1234'

  const path = 'v1/responses'
  const body = {
    model: `${modelName}`,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', 'text': options.prompt },
          {
            type: 'input_image',
            image_url: options.dataUrl
          }
        ]
      }
    ]
  }

  const response = await fetch(`${modelOrigin}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(body),
    // signal: AbortSignal.timeout(1000) // TODO verify this works
  });

  if (!response.ok) {
    throw new Error(`MODEL__HTTP_ERROR__${modelName}: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export const Prompts = {
  GeneralStructuredImagePrompt: `
    Return a list of string tags that would be useful to categorize this image in search.
    Only include each type of tag once. For example close-up, close-up shot and close distance are duplications and should be excluded. 
    All tags should be lowercase in a single comma separated string, no newlines.
    The following is the only tags that must be returned. 
    They are formatted how they should be returned with either a description of the expected return value or a range of allowed values separated by | characters.
    Sample return csv: colors: red:green:blue,humanCount:1, animalCount:0, shortDescription: a boy playing in water etc.
    shortDescription: text describing the image, short and succinct
    longDescription: text describing the image, elaborate description
    colors: names of colors present, 
    weather: summer|winter|fall|spring, 
    distanceFromSubject: close|medium|far
    inanimateObjectCount:number, 
    humanCount:number, 
    animalCount: number,
    dogCount: number,
    birdCount: number 
    buildingCount: number, 
    humansUnder20YearsOld:number,
    humansBetween20And60YearsOld:number,
    humansGreaterThan60YearsOld:number,
    `,
  NumFacesPrompt: `
    Return the number of faces detected in this image. Return in a structured format as parseable json that looks like {faces: countOfFacesDetected}
    `
}

/**
 * Used to run the script as standalone from a file or a web url, can also be a FE fileView url
 */
const main = async () => {
  const [, , url] = argv;
  if (!url) {
    console.error('Usage: tsx src/image.ts <url>');
    exit(1);
  }

  try {
    console.time('datauri')
    const dataUriFn = url.includes('http') ? createDataUriFromImageUrl : createDataUriFromFilePath
    const dataUrl = await dataUriFn(url);
    console.timeEnd('datauri')

    console.time('callmodel')
    const modelRespData = await callModelWithImageInput({
      modelName: undefined,
      modelOrigin: 'http://192.168.2.156:1234',
      prompt: Prompts.GeneralStructuredImagePrompt,
      dataUrl
    })
    console.timeEnd('callmodel')

    for (const output of modelRespData.output) {
      for (const content of output.content) {
        console.log(content.text)
      }
    }

  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    exit(1);
  }
};
