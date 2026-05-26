// File Path: js/api/tavilyClient.js
// Purpose: Executes deep web searches to gather cryptographic evidence for LexisAI.

import { Config } from '../core/config.js';
import { ResilienceEngine } from './geminiRetry.js';

export class TavilyClient {
    constructor() {
        this.endpoint = Config.ENDPOINTS.TAVILY;
    }

    /**
     * Executes an advanced search query.
     * @param {string} query - The specific, synthesized search query.
     * @returns {Promise<Array>} Array of result objects { title, url, content }.
     */
    async search(query) {
        console.log(`[TavilyClient] Initiating Deep Search for: "${query}"`);
        
        const operation = async () => {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    search_depth: "advanced",
                    max_results: 20,
                    include_answer: false,
                    include_raw_content: false
                })
            });

            if (!response.ok) {
                throw new Error(`Tavily API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.results || [];
        };

        return await ResilienceEngine.executeWithRetry(operation, 3, 1500);
    }
}

export const tavily = new TavilyClient();
