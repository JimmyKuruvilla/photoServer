import { Logger } from "pino"
import { ChatModelResponse } from "./types.ts"

export const integrations = [
  { type: 'plugin', id: 'mcp/googlecalendar' },
  { type: 'plugin', id: 'mcp/fetch' },
  { type: 'plugin', id: 'mcp/filesystem' }
]

export const logModelChatResponse = async (response: ChatModelResponse, log: Logger, isDebug = false) => {
  if (response?.output?.length) {
    log.info(response?.output?.map(
      o => o?.type === 'message'
        ? o.content.split('\n')
        : isDebug
          ? `${o.tool}, ${JSON.stringify(o.arguments)}, ${JSON.stringify(o.output)}`
          : o.tool
    ))
  } else {
    log.info(response)
  }
}

export const getModelChatRespText = (response: ChatModelResponse) => {
  return response?.output?.flatMap(o =>
    o?.type === 'message'
      ? o.content
      : 'not message'
  ).join('\n')
}