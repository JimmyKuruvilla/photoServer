import { ModelResponse } from '../types.ts';
import { isFunctionCall, LMStudioTypes } from '../mcpAssistUtils.ts';

export const getHoroscope = (args: { sign: string }) => {
  return args.sign + " Next Tuesday you will befriend a baby otter.";
}
export const getHoroscopeNumber = (args: { horoscope: string }) => {
  return args.horoscope.length
}


export const applyLocalTools = async (response: ModelResponse) => {
  const ToolsMap = new Map()
  ToolsMap.set('getHoroscope', getHoroscope)
  ToolsMap.set('getHoroscopeNumber', getHoroscopeNumber)

  const fnCallInputs = []
  const fnCallItems = response.output.filter(isFunctionCall)
  for (const item of fnCallItems) {
    if (ToolsMap.has(item.name)) {
      const args = JSON.parse(item.arguments)
      const result = ToolsMap.get(item.name)(args)

      fnCallInputs.push({
        type: LMStudioTypes.FUNCTION_CALL_OUTPUT,
        call_id: item.call_id,
        output: JSON.stringify({ result })
      })
    } else {
      throw new Error(`REQUESTING_INVALID_TOOL ${item.name}`)
    }
  }
  return fnCallInputs
}