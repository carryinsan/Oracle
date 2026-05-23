// js/api/tavilyClient.js

export class TavilyClient {
    constructor(apiKey) {
        this.baseUrl = "/api/tavily";
    }

    async executeSearch(query, advanced = true) {
        const payload = {
            query: query,
            search_depth: "advanced", // FORCED ADVANCED DEPTH
            include_raw_content: true,
            include_domains: [],
            exclude_domains: [],
            max_results: 18 // FORCED 18 RESULTS PER QUERY
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

            if (!response.ok) throw new Error(`Tavily API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[TavilyClient] Query failed: "${query}"`, error);
            return { results: [] }; 
        }
    }
}
