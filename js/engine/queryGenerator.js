/**
 * LexisAI Parallel Query Formulation Engine
 * Path: /js/engine/queryGenerator.js
 */
import { groqClient } from '../api/groqClient.js';
import { state } from './researchState.js';
import { eventBus } from '../core/eventBus.js';

export class QueryGenerator {
    static async generateBranch(branchName, systemPrompt, userIntent) {
        try {
            let branchLabel = branchName === 'A' ? 'Ontology' : branchName === 'B' ? 'Contrarian' : branchName === 'C' ? 'Temporal' : branchName === 'D' ? 'Gap-Fill' : 'Contradiction Resolution';
            
            // EXACT SCREENSHOT TEXT
            eventBus.emit('TERMINAL_LOG', { message: `> Generating ${branchLabel} Branch...` });
            
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userIntent }
            ];

            const queries = await groqClient.generateJSON(messages);
            
            if (!Array.isArray(queries)) {
                throw new Error("Model returned non-array payload.");
            }
            return queries.slice(0, 3);
            
        } catch (error) {
            eventBus.emit('TERMINAL_LOG', { message: `> [WARN] Branch ${branchName} degraded. Applying fallback heuristics.` });
            return [`${state.query} analysis`, `${state.query} details`];
        }
    }
}
