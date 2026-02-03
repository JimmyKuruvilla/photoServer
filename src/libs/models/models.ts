import { createLogger } from '../pinologger.ts';
import { ChatModelResponse, ModelCallOptions, ModelResponse } from './types.ts';
import { DEFAULT_MODEL, JWIND_ORIGIN } from './constants.ts';
import { applyMCPToolsAsFns, isRequestingFnUse, logModelResponse, ModelRoles } from './mcpAssistUtils.ts';
import { Client } from '@modelcontextprotocol/sdk/client';
const log = createLogger('[MODELS]')

export const constructInputForV1Responses = (options: ModelCallOptions) => {
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
 * Used to call local network model and returns a single response using the v1/responses API
 * Does support custom tool use but needs MCPAssist to handle mcp usage
 */
export const v1Responses = async (options: ModelCallOptions, { quiet } = { quiet: true }): Promise<ModelResponse> => {
  const path = 'v1/responses'
  const modelName = options.modelName ?? DEFAULT_MODEL
  const modelOrigin = options.modelOrigin ?? JWIND_ORIGIN

  const input = constructInputForV1Responses(options)
  quiet ? null : log.info(input)

  const body = {
    model: modelName,
    input,
    ...(options.integrations ? { integrations: options.integrations } : null),
    ...(options.tools ? { tools: options.tools } : null),
    ...(options.instructions ? { instructions: options.instructions } : null)
  }

  const response = await fetch(`${modelOrigin}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LM_STUDIO_API_KEY}`,
    },
    body: JSON.stringify(body)
  });

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`MODEL__HTTP_ERROR__${modelName}: ${response.status}, ${json.error.message}`);
  }

  return json;
}

export const v1ResponsesWithMcpAssist = async (mcpClient: Client, options: ModelCallOptions, { quiet } = { quiet: true }): Promise<ModelResponse> => {
  let response = await v1Responses(options)
  quiet ? null : await logModelResponse(response, log)

  let input = constructInputForV1Responses(options)
  while (isRequestingFnUse(response)) {
    const toolOutputs = await applyMCPToolsAsFns(mcpClient, response, createLogger('[MCP_TOOL_USE]'))
    input = input.concat(response.output, toolOutputs)
    response = await v1Responses({ tools: options.tools, input })

    quiet ? null : await logModelResponse(response, log)
  }

  return response;
}

/*
* LM Studio specific api that allows remote mcp integrations
* Does not support custom tool usage
* LMS api can also be used to load and unload models
*/
export const constructInputForV1Chat = (options: ModelCallOptions) => {
  return options.input ?? [
    { type: 'text', content: options.prompt },
    ...(options.dataUrl ? [{ type: 'image', data_url: options.dataUrl }] : [])
  ]
}

export const v1Chat = async (options: ModelCallOptions, { quiet } = { quiet: true }): Promise<ChatModelResponse> => {
  const path = 'api/v1/chat'
  const modelName = options.modelName ?? DEFAULT_MODEL
  const modelOrigin = options.modelOrigin ?? JWIND_ORIGIN

  const input = constructInputForV1Chat(options)
  quiet ? null : log.info(input)

  const body = {
    model: modelName,
    input,
    ...(options.integrations ? { integrations: options.integrations } : null),
    ...(options.instructions ? { system_prompt: options.instructions } : null)
  }

  const response = await fetch(`${modelOrigin}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LM_STUDIO_API_KEY}`,
    },
    body: JSON.stringify(body)
  });

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`MODEL__HTTP_ERROR__${modelName}: ${response.status}, ${json.error.message}`);
  }

  return json;
}