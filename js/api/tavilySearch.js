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

    // THE OMNI-EXTRACTOR: Cracks Arrays, Objects, and Bulleted Text Strings
    _extractQueries(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;

        if (typeof data === 'string') {
            try {
                let parsed = JSON.parse(data);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}

            // If Groq returned a bulleted string list instead of an array, parse it manually
            return data.split('\n')
                       .map(line => line.replace(/^[-*0-9.)]+\s*/, '').replace(/["']/g, '').trim())
                       .filter(line => line.length > 5);
        }

        if (typeof data === 'object' && data !== null) {
            // Level 1: Find any explicit array
            for (let key of Object.keys(data)) {
                if (Array.isArray(data[key])) return data[key];
            }
            // Level 2: Search deeper into nested objects
            for (let key of Object.keys(data)) {
                if (typeof data[key] === 'object') {
                    let deep = this._extractQueries(data[key]);
                    if (deep.length > 0) return deep;
                }
            }
            // Level 3: If Groq just gave a giant string block, rip the text out and convert to array
            let strings = Object.values(data).filter(v => typeof v === 'string' && v.length > 10);
            if (strings.length > 0) {
                return this._extractQueries(strings[0]);
            }
        }
        
        return [];
    }

    async executeBranch(branchName) {
        let rawQueries = researchState.get(`queries.${branchName}`);
        
        // Pass Groq's unpredictable output into the Omni-Extractor
        let queries = this._extractQueries(rawQueries);

        if (!Array.isArray(queries) || queries.length === 0) {
            eventBus.publish('PIPELINE_ACTION', { action: `Warning: No valid queries generated for ${branchName}. Skipping.` });
            return [];
        }

        let aggregatedResults = [];

        for (let query of queries) {
            // Failsafe in case Groq returned an array of objects: e.g., [{"q": "search"}]
            if (typeof query === 'object' && query !== null) {
                query = query.query || query.q || query.search_term || Object.values(query)[0];
            }
            if (typeof query !== 'string' || !query.trim()) continue;

            await sleep(5000); // Strict Tavily Pacing
            
            eventBus.publish('PIPELINE_ACTION', { action: `Executing Search: "${query.substring(0, 75)}..."` });
            
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
