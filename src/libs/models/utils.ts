import { Logger } from 'pino'
import { ModelResponse } from './types.ts'
import { Client } from '@modelcontextprotocol/sdk/client'

export const LMStudioTypes = {
  FUNCTION: 'function',
  FUNCTION_CALL: 'function_call',
  FUNCTION_CALL_OUTPUT: 'function_call_output'
}

export const ModelRoles = {
  USER: 'user',
  ASSISTANT: 'assistant'
}

export const isFunctionCall = (obj: { type: string }) => {
  return obj.type === LMStudioTypes.FUNCTION_CALL
}

export const isRequestingFnUse = (response: ModelResponse) => {
  return response.output.some(isFunctionCall)
}

const outputProps = (o: any) => ({
  name: o?.name,
  role: o?.role,
  status: o?.status,
  type: o?.type,
  args: o?.arguments,
})
export const logModelResponse = async (response: ModelResponse, log: Logger) => {
  if (response?.output?.length) {
    log.info(response?.output?.map(
      o => o?.content ?
        o?.content?.map(
          c => ({
            ...outputProps(o),
            text: c?.text.split('\n')
          })
        )
        : outputProps(o),
    ))
  } else {
    log.info(response)
  }
}

/**
 * We transform the mcp tools list into type:function and pass parameters instead of input_schema. 
 * This *seems* to allow llms to use them as if they were function calls
 * But models seem to make parameter mistakes which implies it doesn't work quite right. 
 */
export type MCPTool = {
  name: string;
  description: string | undefined;
  input_schema: {
    [x: string]: unknown;
    type: "object";
    properties?: Record<string, object> | undefined;
    required?: string[] | undefined;
  };
}
export const transformMCPToolsToFns = (mcpToolList: MCPTool[]) => mcpToolList.map(t => ({
  ...t,
  type: LMStudioTypes.FUNCTION,
  parameters: {
    type: t.input_schema.type,
    properties: t.input_schema.properties,
    required: t.input_schema.required
  }
}))

export const applyMCPToolsAsFns = async (mcpClient: Client, response: ModelResponse, log: Logger) => {
  const fnCallOutputs = []
  const fnCallItems = response.output.filter(isFunctionCall)
  for (const item of fnCallItems) {
    const args = JSON.parse(item.arguments)

    log.info(`${item.name} with args: ${item.arguments}`)
    const result = await mcpClient.callTool({
      name: item.name,
      arguments: args,
    });

    fnCallOutputs.push({
      type: LMStudioTypes.FUNCTION_CALL_OUTPUT,
      call_id: item.call_id,
      output: JSON.stringify({ result })
    })
  }
  return fnCallOutputs
}
