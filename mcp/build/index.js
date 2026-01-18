import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from 'fs';
import { z } from "zod";
// Create server instance
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
});
server.registerTool("get_base64_from_file_path", {
    description: "Get a file path and return the contents encoded as base64",
    inputSchema: {
        state: z
            .string()
            .describe("absolute file path as an input"),
    },
}, async ({ state }) => {
    const fileBuffer = fs.readFileSync(state);
    const b64 = fileBuffer.toString('base64');
    return {
        content: [
            {
                type: "text",
                text: b64,
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
