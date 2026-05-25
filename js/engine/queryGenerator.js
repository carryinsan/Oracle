/**
 * LexisAI Parallel Query Formulation Engine
 * Path: /js/engine/queryGenerator.js
 */
import { groqClient } from '../api/groqClient.js';
import { state } from './researchState.js';
import { eventBus } from '../core/eventBus.js';
import * as Prompts from '../prompts/systemPrompts.js';

export class QueryGenerator {
    static async generateBranch(branchName, systemPrompt, userIntent) {
        try {
            eventBus.emit('TERMINAL_LOG', { message: `[COG_ENGINE] Formulating search matrix for ${branchName}...` });
            
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userIntent }
            ];

            const queries = await groqClient.generateJSON(messages);
            
            // Built-In Error Solving: Array Validation
            if (!Array.isArray(queries)) {
                throw new Error("Llama-4-Scout returned non-array payload.");
            }
            
            return queries.slice(0, 3); // Strictly enforce 3 queries per branch (3x5 branches = 15 Tavily passes)
            
        } catch (error) {
            console.error(`[QueryGenerator] Branch ${branchName} failed:`, error);
            eventBus.emit('TERMINAL_LOG', { message: `[WARN] Branch ${branchName} degraded. Applying fallback heuristics.` });
            
            // Failsafe: Return a safe, generic query based on intent so search doesn't stall
            return [`${state.query} analysis`, `${state.query} details`];
        }
    }
}
