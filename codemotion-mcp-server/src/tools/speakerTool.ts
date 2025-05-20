import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

/**
 * Registers the speakers tool in the MCP server.
 *
 * @param server - The MCP server instance to register the tool with.
 */
export const registerSpeakerTool = (server: any): void => {
    // Get speakers from Codemotion agenda in Qdrant
    server.tool(
        'speakers',
        'Get the list of speakers from Codemotion agenda',
        {
            query: z.string().min(1).max(100).optional()
        },
        /**
         * Handler for fetching speakers from Qdrant based on an optional query.
         * @param query - Optional query string to search speakers.
         * @returns An object containing the formatted speaker results or an error message.
         */
        async ({ query }: { query?: string }) => {
            const chalk = (await import('chalk')).default;
            console.log(chalk.blue('Codemotion MCP Server: Speakers tool called'));
            console.log(chalk.blue('Codemotion MCP Server: Query:', query));

            try {
                // Create a Qdrant client
                const qdrantClient = new QdrantClient({
                    host: 'qdrant',
                    port: 6333,
                    https: false,
                    checkCompatibility: false
                });

                let searchResponse;

                // If there's a query, use vector search
                if (query) {
                    console.log(chalk.blue('Vectorizing the query...'));

                    // Create OpenAI client
                    const openaiClient = new OpenAI({
                        apiKey: process.env.GITHUB_TOKEN,
                        baseURL: process.env.GITHUB_MODELS_URL,
                    });

                    // Generate the embedding for the query
                    const response = await openaiClient.embeddings.create({
                        model: process.env.GITHUB_MODELS_MODEL_FOR_EMBEDDINGS || 'text-embedding-3-large',
                        input: query
                    });

                    // Get the vector from the response
                    const vector = response.data[0].embedding;
                    console.log(chalk.blue('Codemotion MCP Server: Vector created'));
                    console.log(chalk.blue('Codemotion MCP Server: Searching for speakers in Qdrant...'));

                    // Search for the sessions in Qdrant using vector search
                    searchResponse = await qdrantClient.query(
                        process.env.QDRANT_COLLECTION_NAME || 'codemotion',
                        {
                            query: vector,
                            limit: 10,
                            with_payload: true
                        }
                    );
                } else {
                    // If no query provided, get all speakers via scroll API
                    console.log(chalk.blue('Codemotion MCP Server: No query provided, fetching all speakers...'));
                    
                    searchResponse = await qdrantClient.scroll(
                        process.env.QDRANT_COLLECTION_NAME || 'codemotion',
                        {
                            limit: 100,
                            with_payload: true
                        }
                    );
                }

                console.log(chalk.blue('Codemotion MCP Server: Search response received'));

                // Extract unique speakers from the search results
                const points = query ? searchResponse.points : searchResponse.points;
                const speakersSet = new Set<string>();

                points.forEach((point: any) => {
                    const speakersData = point.payload?.speakers;
                    if (speakersData) {
                        if (typeof speakersData === 'string' && speakersData.trim() !== '') {
                            // If speakers is a single string, split by commas (as it might be comma-separated)
                            speakersData.split(', ').forEach(speaker => {
                                if (speaker.trim() !== '') {
                                    speakersSet.add(speaker.trim());
                                }
                            });
                        }
                    }
                });

                // Convert Set to Array and sort alphabetically
                const speakersArray = Array.from(speakersSet).sort();

                console.log(chalk.blue(`Codemotion MCP Server: ${speakersArray.length} unique speakers found`));

                // Format the result
                const speakersList = speakersArray.map(speaker => `- ${speaker}`).join('\n');
                const result = `Speakers from Codemotion agenda${query ? ` matching "${query}"` : ''}:\n${speakersList}\n`;

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
                console.error(chalk.red('Codemotion MCP Server: Error fetching speakers from Qdrant:', error));
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error fetching speakers from Qdrant: ${error?.message || 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    );
};