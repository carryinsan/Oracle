// js/api/tavilyClient.js
import { eventBus } from '../core/eventBus.js';

export class TavilyClient {
    constructor(apiKey) {
        this.baseUrl = "/api/tavily";
    }

    async executeSearch(query, advanced = true) {
        const payload = {
            query: query,
            search_depth: "advanced",
            include_raw_content: true,
            include_domains: [],
            exclude_domains: [],
            max_results: 18 
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); 

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Tavily API Error (${response.status}): ${errText}`);
            }
            
            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[TavilyClient] Query skipped: "${query}"`, error);
            
            // DOWNGRADE: Changed from PIPELINE_ERROR to PIPELINE_ACTION so it doesn't falsely halt the UI
            eventBus.publish('PIPELINE_ACTION', { action: `Search Engine Timeout. Skipping query...` });
            
            return { results: [] }; 
        }
    }
}
