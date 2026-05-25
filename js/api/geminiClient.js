/**
 * LexisAI Gemini Load-Balanced Client
 * Path: /js/api/geminiClient.js
 */
import { withRetry } from './geminiRetry.js';
import { SSEParser } from './geminiStream.js';

class GeminiClient {
    async streamContent(messages, onChunkCallback) {
        const apiCall = async () => {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: messages })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || response.statusText);
            }
            return response;
        };

        const response = await withRetry(apiCall);
        await SSEParser.parseStream(response, onChunkCallback);
    }
}
export const geminiClient = new GeminiClient();
