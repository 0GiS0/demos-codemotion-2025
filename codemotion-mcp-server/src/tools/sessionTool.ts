import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

/**
 * Registers the sessions tool in the MCP server.
 *
 * @param server - The MCP server instance to register the tool with.
 */
export const registerSessionTool = (server: any): void => {
    // Get sessions from Codemotion agenda in Qdrant
    server.tool(
        'sessions',
        'Get the sessions from Codemotion agenda',
        {
            date: z.string().optional(),
            query: z.string().min(1).max(100)
        },
        /**
         * Handler for fetching sessions from Qdrant based on a query and optional date.
         * @param date - Optional date string to filter sessions.
         * @param query - Query string to search sessions.
         * @returns An object containing the formatted session results or an error message.
         */
        async ({ date, query }: { date?: string; query: string }) => {
            const chalk = (await import('chalk')).default;
            console.log(chalk.blue('Codemotion MCP Server: Sessions tool called'));
            console.log(chalk.blue('Codemotion MCP Server: Date:', date));
            console.log(chalk.blue('Codemotion MCP Server: Query:', query));
            console.log(chalk.blue('Vectorizing the query...'));

            try {
                // Create OpenAI client
                const openaiClient = new OpenAI({
                    apiKey: process.env.GITHUB_TOKEN,
                    baseURL: process.env.GITHUB_MODELS_URL,
                });


                // Generate the embedding for the query
                const response = await openaiClient.embeddings.create({
                    model: process.env.GITHUB_MODELS_MODEL_FOR_EMBEDDINGS || 'text-embedding-3-large',
                    input: query || 'none'
                });

                // Get the vector from the response
                const vector = response.data[0].embedding;
                console.log(chalk.blue('Codemotion MCP Server: Vector:', vector));
                console.log(chalk.blue('Codemotion MCP Server: Searching for sessions in Qdrant...'));

                // Create a Qdrant client
                const qdrantClient = new QdrantClient({
                    host: process.env.QDRANT_HOST || 'qdrant',
                    port: Number(process.env.QDRANT_PORT) || 6333,
                    https: false,
                    checkCompatibility: false
                });

                // Search for the sessions in Qdrant
                const searchResponse = await qdrantClient.query(
                    process.env.QDRANT_COLLECTION_NAME || 'codemotion',
                    {
                        query: vector,
                        limit: 3,
                        with_payload: true
                    }
                );

                console.log(chalk.blue('Codemotion MCP Server: Search response:', searchResponse));
                console.log(chalk.blue('Codemotion MCP Server: Sessions found:'));
                console.log(searchResponse);

                // Prepare and format the result
                const sessions = (searchResponse.points || []).map((session: any) =>
                    `- ${session.payload?.date}: ${session.payload?.title} by ${session.payload?.speaker}`
                );
                const result = `Sessions for ${date || 'today'} with query ${query || 'none'}:\n${sessions.join('\n')}\n`;

                return {
                    content: [
                        {
                            type: 'text',
                            text: result
                        }
                    ]
                };
            
            } catch (error: any) {
                console.dir(error, { depth: null });
                console.error(chalk.red('Codemotion MCP Server: Error searching for sessions in Qdrant:', error));
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error searching for sessions in Qdrant: ${error?.message || 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    );
};