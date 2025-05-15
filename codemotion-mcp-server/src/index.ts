import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';;
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';



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

        // Get the time
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

        // Get sessions from codemotion agenda in Qdrant
        server.tool("sessions", "Get the sessions from codemotion agenda in Qdrant",
            {
                date: z.string().optional(),
                query: z.string().optional()
            },
            async ({ date, query }) => {

                const chalk = (await import('chalk')).default;
                console.log(chalk.blue('Codemotion MCP Server: Sessions tool called'));

                // Create a Qdrant client
                const qdrant_client = new QdrantClient({ host: "localhost", port: 6333 });

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

                // Search for the sessions in Qdrant
                const searchResponse = await qdrant_client.query("codemotion-agenda",
                    {
                        query: vector,
                        limit: 3
                    });

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