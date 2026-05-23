// js/api/tavilySearch.js
import { TavilyClient } from './tavilyClient.js';
import { TavilyCompressor } from './tavilyCompressor.js';
import { researchState } from '../engine/researchState.js';

export class TavilySearchOrchestrator {
    constructor(apiKey) {
        this.client = new TavilyClient(apiKey);
    }

    async executeBranch(branchName) {
        const queries = researchState.get(`queries.${branchName}`) || [];
        if (queries.length === 0) return [];

        console.log(`[TavilySearch] Executing parallel batch for branch: ${branchName}`);

        // Execute all queries in the branch concurrently
        const searchPromises = queries.map(query => this.client.executeSearch(query, true));
        const responses = await Promise.all(searchPromises);

        let aggregatedResults = [];
        responses.forEach(response => {
            const compressed = TavilyCompressor.processSearchResults(response);
            aggregatedResults = aggregatedResults.concat(compressed);
        });

        return aggregatedResults;
    }

    async executeInitialPhase() {
        // Run Ontology (A), Contrarian (B), and Temporal (C) branches simultaneously
        const [resultsA, resultsB, resultsC] = await Promise.all([
            this.executeBranch('branch_A'),
            this.executeBranch('branch_B'),
            this.executeBranch('branch_C')
        ]);

        return [...resultsA, ...resultsB, ...resultsC];
    }
}
