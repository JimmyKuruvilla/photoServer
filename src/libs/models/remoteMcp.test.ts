import { createLogger } from "../pinologger.ts";
import { v1Responses, v1Chat } from "./models.ts";
import { integrations, logModelChatResponse } from "./utils.ts";


const log = createLogger('REMOTE_MCP_TEST')
const test = async () => {

  // const tools = [
  //   {
  //     "type": "mcp",
  //     "server_label": "googlecalendar",
  //     "server_url": "https://huggingface.co/mcp",
  //   },
  //   {
  //     "type": "mcp",
  //     "server_label": "fetch",
  //     "server_url": "https://huggingface.co/mcp",
  //   },
  //   {
  //     "type": "mcp",
  //     "server_label": "filesystem",
  //     "server_url": "https://huggingface.co/mcp",
  //   }
  // ]


  console.time('INITIAL_MODEL_RESPONSE')
  const prompt = `what is in the news on bbc.com?`
  // const prompt = `What events do I have for today? `
  // const prompt = `Add an event for today at 3pm called 'testing' and invite jimmyjk@gmail.com`
  // const prompt = `If there is an event called 'Testing' uppercase or lowercase for today, delete it.`
  // const prompt = `What calendars are available and what are teir ids? Only return the ids nothing else`
  let response = await v1Chat({ integrations, prompt })
  log.info('INITIAL_MODEL_RESPONSE')
  console.log(JSON.stringify(response, null, 2))
  await logModelChatResponse(response, log)

  // DEBUG ONLY
  // log.info('FinalModelInput');
  // log.info(input)

  // log.info('FinalModelOutput')
  // await logModelResponse(response, log)
}

// await test()