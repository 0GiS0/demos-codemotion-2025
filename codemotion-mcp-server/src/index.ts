import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';;
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

//load env variables
import dotenv from 'dotenv';

// Tools
import { registerTimeTool } from './tools/timeTool.js';




dotenv.config();

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

        registerTimeTool(server);

        // Get sessions from codemotion agenda in Qdrant
        server.tool("sessions", "Get the sessions from codemotion agenda in Qdrant",
            {
                date: z.string().optional(),
                query: z.string().min(1).max(100)
            },
            async ({ date, query }) => {

                const chalk = (await import('chalk')).default;
                console.log(chalk.blue('Codemotion MCP Server: Sessions tool called'));

                console.log(chalk.blue('Codemotion MCP Server: Date:', date));
                console.log(chalk.blue('Codemotion MCP Server: Query:', query));

                console.log(chalk.blue('Vectorizing the query...'));

                // Create Open AI client
                const openai_client = new OpenAI({
                    apiKey: process.env.GITHUB_TOKEN,
                    baseURL: process.env.GITHUB_MODELS_URL,
                });

                const response = await openai_client.embeddings.create({
                    model: process.env.GITHUB_MODELS_MODEL_FOR_EMBEDDINGS || "text-embedding-3-large",
                    input: query || "none"
                });

                const vector = response.data[0].embedding;

                console.log(chalk.blue('Codemotion MCP Server: Vector:', vector));

                console.log(chalk.blue('Codemotion MCP Server: Searching for sessions in Qdrant...'));

                // Create a Qdrant client
                const qdrant_client = new QdrantClient({ host: "qdrant", port: 6333, https: false, checkCompatibility: false });


                try {
                    // Search for the sessions in Qdrant
                    const searchResponse = await qdrant_client.query(process.env.QDRANT_COLLECTION_NAME || "codemotion",
                        {
                            query: vector,
                            limit: 3,
                            with_payload: true

                        });

                    console.log(chalk.blue('Codemotion MCP Server: Search response:', searchResponse));

                    console.log(chalk.blue('Codemotion MCP Server: Sessions found:'));
                    console.log(searchResponse);

                    // Prepare the result

                    const sessions = searchResponse.points.map((session) => {
                        return {
                            date: session.payload?.date,
                            title: session.payload?.title,
                            speaker: session.payload?.speaker,
                        }
                    });

                    // Format the result
                    let result = `Sessions for ${date || 'today'} with query ${query || 'none'}:\n`;
                    sessions.forEach((session: { date: any; title: any; speaker: any; }) => {
                        result += `- ${session.date}: ${session.title} by ${session.speaker}\n`;
                    });

                    return {
                        content: [
                            {
                                type: "text",
                                text: result
                            }
                        ]
                    };
                }
                catch (error) {

                    console.dir(error, { depth: null });
                    console.error(chalk.red('Codemotion MCP Server: Error searching for sessions in Qdrant:', error));

                    return {
                        content: [
                            {
                                type: "text",
                                text: 'Error searching for sessions in Qdrant'
                            }
                        ]
                    };
                }

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