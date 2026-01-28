import { createLogger } from '../../pinologger.ts';
import { applyLocalTools } from './utils.ts';
import { callModel } from '../models.ts';
import { isRequestingFnUse } from '../utils.ts';

const log = createLogger('[LocalTools]')

const testLocalTools = async () => {
  console.time('model_call')
  const tools = [
    {
      type: "function",
      name: "getHoroscope",
      description: "Get today's horoscope for an astrological sign.",
      parameters: {
        type: "object",
        properties: {
          sign: {
            type: "string",
            description: "An astrological sign like Taurus or Aquarius",
          },
        },
        required: ["sign"],
      },
    },
    {
      type: "function",
      name: "getHoroscopeNumber",
      description: "Given a horoscope, get a lucky number",
      parameters: {
        type: "object",
        properties: {
          horoscope: {
            type: "string",
            description: "A horoscope for a person",
          },
        },
        required: ["horoscope"],
      },
    },
  ];

  let input: any[] = [
    { role: "user", content: "What is my lucky number? I am an Aquarius." },
  ];

  let response = await callModel({ tools, input })

  while (isRequestingFnUse(response)) {
    input = input.concat(await applyLocalTools(response))
    response = await callModel({ tools, input })
  }

  log.info('ModelInput');
  log.info(JSON.stringify(input, null, 2));

  log.info('ModelOutput')
  log.info(JSON.stringify(response.output, null, 2))
  console.timeEnd('model_call')
}
