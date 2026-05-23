// js/api/tavilySearch.js
import { TavilyClient } from './tavilyClient.js';
import { TavilyCompressor } from './tavilyCompressor.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from '../core/eventBus.js';

// The unbreakable 3-second breather function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class TavilySearchOrchestrator {
    constructor(apiKey) {
        this.client = new TavilyClient(apiKey);
    }

    async executeBranch(branchName) {
        const queries = researchState.get(`queries.${branchName}`) || [];
        if (queries.length === 0) return [];

        let aggregatedResults = [];

        // STRICT SEQUENTIAL LOOP: No more Promise.all bursting
        for (const query of queries) {
            // ENFORCE 3-SECOND BREAK BEFORE EVERY SEARCH
            await sleep(3000); 
            
            eventBus.publish('PIPELINE_ACTION', { action: `Executing Search: "${query}"` });
            
            try {
                const response = await this.client.executeSearch(query, true);
                const compressed = TavilyCompressor.processSearchResults(response);
                aggregatedResults = aggregatedResults.concat(compressed);
            } catch (error) {
                console.error(`[TavilySearch] Skipped query due to error: ${query}`);
                // Allow the engine to continue even if one search fails
            }
        }

        return aggregatedResults;
    }

    async executeInitialPhase() {
        // STRICT SEQUENTIAL EXECUTION: Wait for A to finish before starting B
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch A (Ontology) Searches...' });
        const resultsA = await this.executeBranch('branch_A');
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch B (Contrarian) Searches...' });
        const resultsB = await this.executeBranch('branch_B');
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Initiating Branch C (Temporal) Searches...' });
        const resultsC = await this.executeBranch('branch_C');

        return [...resultsA, ...resultsB, ...resultsC];
    }
}
