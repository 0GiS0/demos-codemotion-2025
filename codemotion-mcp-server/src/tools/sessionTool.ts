import { z } from "zod";
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';


export const registerSessionTool = (server: any): void => {
    // Get sessions from codemotion agenda in Qdrant
    server.tool("sessions", "Get the sessions from codemotion agenda in Qdrant",
        {
            date: z.string().optional(),
            query: z.string().min(1).max(100)
        },
        async ({ date, query }: { date?: string; query: string }) => {

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
};