// js/api/tavilySearch.js
import { TavilyClient } from './tavilyClient.js';
import { TavilyCompressor } from './tavilyCompressor.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from '../core/eventBus.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class TavilySearchOrchestrator {
    constructor(apiKey) {
        this.client = new TavilyClient(apiKey);
    }

    async executeBranch(branchName) {
        let queries = researchState.get(`queries.${branchName}`);

        // GROQ JSON CRACKER: If Groq wrapped the array in a master object, extract it safely
        if (queries && !Array.isArray(queries) && typeof queries === 'object') {
            queries = queries.queries || queries.search_queries || queries.branch || Object.values(queries)[0];
        }

        // If it still isn't a valid array after cracking, skip gracefully
        if (!Array.isArray(queries) || queries.length === 0) {
            eventBus.publish('PIPELINE_ACTION', { action: `Warning: No valid queries generated for ${branchName}. Skipping.` });
            return [];
        }

        let aggregatedResults = [];

        for (let query of queries) {
            // Further extraction in case of nested [object Object] artifacts
            if (typeof query === 'object' && query !== null) {
                query = query.query || query.q || query.search_term || Object.values(query)[0];
            }
            if (typeof query !== 'string' || !query.trim()) continue;

            await sleep(5000); // Strict Tavily Pacing
            
            eventBus.publish('PIPELINE_ACTION', { action: `Executing Search: "${query}"` });
            
            try {
                const response = await this.client.executeSearch(query, true);
                const compressed = TavilyCompressor.processSearchResults(response);
                aggregatedResults = aggregatedResults.concat(compressed);
            } catch (error) {
                console.error(`[TavilySearch] Skipped query due to error: ${query}`);
            }
        }

        return aggregatedResults;
    }

    async executeInitialPhase() {
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch A (Ontology) Searches...' });
        const resultsA = await this.executeBranch('branch_A');
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch B (Contrarian) Searches...' });
        const resultsB = await this.executeBranch('branch_B');
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch C (Temporal) Searches...' });
        const resultsC = await this.executeBranch('branch_C');

        return [...resultsA, ...resultsB, ...resultsC];
    }
}
