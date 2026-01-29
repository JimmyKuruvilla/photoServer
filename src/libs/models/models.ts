import { createLogger } from '../pinologger.ts';
import { ModelCallOptions, ModelResponse } from './types.ts';
import { JWIND_ORIGIN } from './constants.ts';
import { applyMCPToolsAsFns, isRequestingFnUse, logModelResponse, ModelRoles } from './utils.ts';
import { Client } from '@modelcontextprotocol/sdk/client';
const log = createLogger('[MODELS]')

export const constructInput = (options: ModelCallOptions) => {
  return options.input ?? [
    {
      role: ModelRoles.USER,
      content: [
        { type: 'input_text', 'text': options.prompt },
        ...(options.dataUrl ? [{ type: 'input_image', image_url: options.dataUrl }] : [])
      ]
    }
  ]
}

/**
 * Used to call local network model and returns a single response
 */
export const callModel = async (options: ModelCallOptions): Promise<ModelResponse> => {
  const path = 'v1/responses'
  const modelName = options.modelName ?? 'qwen/qwen3-vl-8b'
  // 'qwen/qwen3-vl-4b' is ok for photos, dumb for calendar. 
  const modelOrigin = options.modelOrigin ?? JWIND_ORIGIN

  const input = constructInput(options)

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

export const callModelWithMcp = async (mcpClient: Client, options: ModelCallOptions): Promise<ModelResponse> => {
  let response = await callModel(options)
  // await logModelResponse(response, log)

  let input = constructInput(options)
  while (isRequestingFnUse(response)) {
    const toolOutputs = await applyMCPToolsAsFns(mcpClient, response, createLogger('[MCP_TOOL_USE]'))
    input = input.concat(response.output, toolOutputs)
    response = await callModel({ tools: options.tools, input })

    // await logModelResponse(response, log)
  }

  return response;
}
