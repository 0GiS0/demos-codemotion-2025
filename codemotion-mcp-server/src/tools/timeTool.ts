import { z } from 'zod';

/**
 * Registers the time tool in the server. This tool provides the current time, optionally formatted for a specific timezone.
 * @param server - The server instance to register the tool with.
 */
export const registerTimeTool = (server: any): void => {
    server.tool(
        'time',
        'Get the current time. It receives an optional timezone parameter. If no timezone is provided, it returns the current time in UTC.',
        {
            timezone: z.string().optional()
        },
        /**
         * Returns the current time, formatted for the specified timezone if provided.
         * @param timezone - Optional IANA timezone string.
         * @returns An object containing the formatted time string.
         */
        async ({ timezone }: { timezone?: string }) => {
            const chalk = (await import('chalk')).default;
            console.log(chalk.blue('Codemotion MCP Server: Time tool called'));

            let timeString: string;

            if (timezone) {
                try {
                    const now = new Date();
                    timeString = new Intl.DateTimeFormat('es-ES', {
                        timeZone: timezone,
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }).format(now) + ` (${timezone})`;
                } catch (error) {
                    timeString = `Invalid timezone: ${timezone}`;
                }
            } else {
                timeString = new Date().toISOString();
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: timeString
                    }
                ]
            };
        }
    );
};