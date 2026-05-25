/**
 * LexisAI Token Governor
 * Path: /js/engine/tokenManager.js
 */
import { state } from './researchState.js';

export class TokenManager {
    static estimateTokens(text) {
        if (!text) return 0;
        // Fast heuristic: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    static deduct(text) {
        const tokens = this.estimateTokens(JSON.stringify(text));
        state.token_budget.remaining -= tokens;
        
        if (state.token_budget.remaining < 50000) {
            console.warn("[BUDGET WARNING] Token budget critically low. Forcing compression.");
        }
    }

    static reset() {
        state.token_budget.remaining = state.token_budget.total_allocated;
    }
}
