import { createLogger } from '../pinologger.ts';
import { ModelCallOptions, ModelResponse } from './types.ts';
import { JWIND_ORIGIN } from './constants.ts';
import { ModelRoles } from './utils.ts';
const log = createLogger('[MODELS]')

/**
 * Used to call local network model and returns a single response
 */
export const callModel = async (options: ModelCallOptions): Promise<ModelResponse> => {
  const path = 'v1/responses'
  const modelName = options.modelName ?? 'qwen/qwen3-vl-4b'
  const modelOrigin = options.modelOrigin ?? JWIND_ORIGIN

  const input = options.input ?? [
    {
      role: ModelRoles.USER,
      content: [
        { type: 'input_text', 'text': options.prompt },
        ...(options.dataUrl ? [{ type: 'input_image', image_url: options.dataUrl }] : [])
      ]
    }
  ]

  const body = {
    model: `${modelName}`,
    ...(options.tools ? { tools: options.tools } : null),
    input,
    ...(options.instructions ? { instructions: options.instructions } : null)
  }

  const response = await fetch(`${modelOrigin}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`MODEL__HTTP_ERROR__${modelName}: ${response.status}, ${json.error.message}`);
  }

  return json;
}
