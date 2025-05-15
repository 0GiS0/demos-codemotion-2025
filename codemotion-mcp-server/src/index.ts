import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';;
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";


// Create an express server
const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {

    // Check if the session Id exists
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {

        // Reuse existing transport
        transport = transports[sessionId];
    }
    else if (!sessionId && isInitializeRequest(req.body)) {

        // Create a new transport
        // New initialization request
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                // Store the transport by session ID
                transports[sessionId] = transport;
            }
        });

        // Clean up the transport when the session is closed
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };

        // Create MCP server
        const server = new McpServer({
            name: "Codemotion MCP Server",
            version: "1.0.0"
        });

        // Add tools
        server.tool("time", "Get the current time. It receives an optional timezone parameter. If no timezone is provided, it returns the current time in UTC.",
            {
                timezone: z.string().optional()
            },
            async ({ timezone }) => {

                const chalk = (await import('chalk')).default;
                console.log(chalk.blue('Codemotion MCP Server: Time tool called'));

                let date: Date;
                let timeString: string;

                if (timezone) {
                    try {
                        // Intl.DateTimeFormat can format in a specific timezone
                        const now = new Date();
                        timeString = new Intl.DateTimeFormat('en-US', {
                            timeZone: timezone,
                            hour12: false,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }).format(now) + ` (${timezone})`;
                    } catch (e) {
                        timeString = `Invalid timezone: ${timezone}`;
                    }
                } else {
                    timeString = new Date().toISOString();
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: timeString
                        }
                    ]
                };
            }
        );

        await server.connect(transport);

    }
    else {
        // Invalid request
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
            },
            id: null,
        });
        return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);

});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3000, async () => {
    const chalk = (await import('chalk')).default;
    console.log(chalk.bgMagentaBright.white.bold('🚀 Codemotion MCP Server está corriendo en http://localhost:3000'));
    console.log(chalk.green('✨ Listo para recibir conexiones MCP ✨'));
});