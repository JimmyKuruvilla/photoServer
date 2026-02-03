
import { getModelRespText } from './models/mcpAssistUtils.ts'
import { v1Responses } from './models/models.ts'
import { StructuredImageDescriptionResponseJson, Prompts } from './models/prompts.ts'
import { createLogger } from './pinologger.ts'
import { genB64Thumbnail } from './thumbnail.ts'
const log = createLogger('IMAGE_DESCRIPTORS')

/**
 * Calls a local model and returns a structured json description
 */
export const getImageDescriptors = async (filePath: string): Promise<StructuredImageDescriptionResponseJson | null> => {
  const b64Image = await genB64Thumbnail(filePath)
  if (b64Image) {
    const modelRespData = await v1Responses({
      dataUrl: b64Image,
      prompt: Prompts.StructuredImageDescription,
    })
    return JSON.parse(getModelRespText(modelRespData))
  } else {
    log.error(`b64 image url creation error`)
    return null
  }
}