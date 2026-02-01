import { Logger } from "pino"
import { ChatModelResponse } from "./types.ts"

export const integrations = [
  { type: 'plugin', id: 'mcp/googlecalendar' },
  { type: 'plugin', id: 'mcp/fetch' },
  { type: 'plugin', id: 'mcp/filesystem' }
]

export const logModelResponse = async (response: ChatModelResponse, log: Logger, isDebug = false) => {
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