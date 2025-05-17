import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';;
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";


//load env variables
import dotenv from 'dotenv';

// Tools
import { registerTimeTool } from './tools/timeTool.js';
import { registerSessionTool } from './tools/sessionTool.js';


dotenv.config();

/**
 * Main entry point for the Codemotion MCP Server.
 * Sets up the Express server, session transport management, and MCP tools.
 */
// Create an express server
const app = express();
app.use(express.json());

/**
 * Map to store transports by session ID.
 * @type {{ [sessionId: string]: StreamableHTTPServerTransport }}
 */
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

/**
 * Handles POST requests for client-to-server communication.
 * @param req - Express request object
 * @param res - Express response object
 */
app.post('/mcp', async (req, res) => {
    try {
        // Check if the session Id exists
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // Create a new transport for a new initialization request
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (newSessionId) => {
                    transports[newSessionId] = transport;
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
                name: 'Codemotion MCP Server',
                version: '1.0.0'
            });

            // Add tools
            registerTimeTool(server);
            registerSessionTool(server);

            await server.connect(transport);
        } else {
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
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            details: (error as Error).message
        });
    }
});

/**
 * Reusable handler for GET and DELETE requests (session management).
 * @param req - Express request object
 * @param res - Express response object
 */
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
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