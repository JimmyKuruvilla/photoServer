import { argv, exit } from 'process';
import { createLogger } from '../pinologger.ts';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { v1Responses } from './models.ts';
import { ModelResponse } from './types.ts';
import { applyMCPToolsAsFns, isFunctionCall, isRequestingFnUse, LMStudioTypes, logModelResponse, ModelRoles, transformMCPToolsToFns } from './mcpAssistUtils.ts';

const log = createLogger('[MCP_ASSIST]')
export const GOOGLE_CAL_MCP_STDIO_SCRIPT_PATH = '/home/j/scripts/photoServer/src/mcp/others/google-calendar-mcp/build/index.js'
let mcpToolList;

/**
 * 01/24/2026 LM Studio supports mcp server usage in chat locally but not over the responses API
 * That's why I'm getting 403s trying to use it. That may change with time, that may not.
 * But we can use local tools or create our own mcp client proxy.
 */

/**
 * Connects to STDIO mcp server and returns available tools
 * built from https://modelcontextprotocol.io/docs/develop/build-client
 * MCPs
 * https://github.com/nspady/google-calendar-mcp#
 * https://github.com/feuerdev/keep-mcp
 */
const connectToMCPServer = async (mcp: Client, serverScriptPath: string, env: Record<string, string> = {}) => {
  try {
    const isJs = serverScriptPath.endsWith('.js');
    const isPy = serverScriptPath.endsWith('.py');
    if (!isJs && !isPy) {
      throw new Error('Server script must be a .js or .py file');
    }

    const command = isPy
      ? process.platform === 'win32'
        ? 'python'
        : 'python3'
      : process.execPath;

    const transport = new StdioClientTransport({ command, args: [serverScriptPath], env });
    await mcp.connect(transport);

    const toolsResult = await mcp.listTools();
    const tools = toolsResult.tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }
    });

    log.info({
      msg: `Connected to server: ${serverScriptPath} with tools:`,
      tools: tools.map(({ name }) => name)
    })
    return tools
  } catch (error: any) {
    log.error(`Failed to connect to MCP server: ${error.message}`);
    throw error;
  }
}

export const initMcpAssist = async () => {
  const mcpClient = new Client({ name: 'jubuntus-mcp-client-stdio', version: '1.0.0' })
  try {
    console.time('connect')
    mcpToolList = await connectToMCPServer(
      mcpClient,
      GOOGLE_CAL_MCP_STDIO_SCRIPT_PATH,
      {
        GOOGLE_OAUTH_CREDENTIALS: process.env.GOOGLE_OAUTH_CREDENTIALS!,
        GOOGLE_CALENDAR_MCP_TOKEN_PATH: process.env.GOOGLE_CALENDAR_MCP_TOKEN_PATH!
      })
    const tools = transformMCPToolsToFns(mcpToolList)
    console.timeEnd('connect')

    return { mcpClient, tools }
  } catch (error) {
    log.error(error)
    await mcpClient.close();
    throw error
  }
}

const test = async () => {
  const mcpClient = new Client({ name: 'jubuntus-mcp-client-stdio', version: '1.0.0' })
  try {

    console.time('connect')
    const mcpToolList = await connectToMCPServer( // don't reconnect on every call, store this in mem and reuse it
      mcpClient,
      GOOGLE_CAL_MCP_STDIO_SCRIPT_PATH,
      {
        GOOGLE_OAUTH_CREDENTIALS: process.env.GOOGLE_OAUTH_CREDENTIALS!,
        GOOGLE_CALENDAR_MCP_TOKEN_PATH: process.env.GOOGLE_CALENDAR_MCP_TOKEN_PATH!
      })
    const tools = transformMCPToolsToFns(mcpToolList)
    console.timeEnd('connect')

    console.time('INITIAL_MODEL_RESPONSE')
    let input: any[] = [
      {
        role: ModelRoles.USER,
        // content: `What events do I have for today? `
        // content: `Add an event for today at 3pm called 'testing' and invite jimmyjk@gmail.com`
        content: `When is it time to throw out eggs?`
        // content: `If there is an event called 'Testing' uppercase or lowercase for today, delete it.`
        // content: `What calendars are available and what are their ids? Only return the ids nothing else`
      },
    ];
    let response = await v1Responses({ tools, prompt: 'when do eggs go bad?', instructions: `todays date is: ${new Date().toLocaleString()}. Don't fetch the date or time, use this as a value.` })
    // let response = await v1Responses({ tools, input, instructions: `todays date is: ${new Date().toLocaleString()}. Don't fetch the date or time, use this as a value.` })
    log.info('INITIAL_MODEL_RESPONSE')
    await logModelResponse(response, log)
    console.timeEnd('INITIAL_MODEL_RESPONSE')

    console.time('TOOL_USAGE')
    while (isRequestingFnUse(response)) {
      console.count('TOOL_LOOP iterations')
      // how to handle multipple tool servers? pass obj keyed by tool name with val ref to client
      const toolOutputs = await applyMCPToolsAsFns(mcpClient, response, createLogger('TOOL_USE'))

      log.info('TOOL_OUTPUTS')
      log.info(toolOutputs)

      input = input.concat(response.output, toolOutputs)
      response = await v1Responses({ tools, input })

      log.info('AFTER_TOOL_RESPONSE')
      await logModelResponse(response, log)
    }
    console.timeEnd('TOOL_USAGE')

    // DEBUG ONLY
    // log.info('FinalModelInput');
    // log.info(input)

    // log.info('FinalModelOutput')
    // await logModelResponse(response, log)
  } catch (error) {
    log.error(error)
    await mcpClient.close();
  }
}

// await test()
