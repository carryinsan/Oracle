// js/engine/tokenManager.js
import { CONFIG } from '../core/config.js';
import { researchState } from './researchState.js';

class TokenManager {
    constructor() {
        this.budget = CONFIG.TOKEN_BUDGET;
    }

    // Heuristic: ~4 characters per token for standard English text
    estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    validatePayload(contextString) {
        const estimatedTokens = this.estimateTokens(contextString);
        
        researchState.update('token_budget.used', estimatedTokens);
        researchState.update('token_budget.remaining', this.budget.MAX_CONTEXT_WINDOW - estimatedTokens);

        if (estimatedTokens > this.budget.COMPRESSION_THRESHOLD) {
            console.warn(`[TokenManager] Payload approaching threshold: ${estimatedTokens} tokens.`);
            return false; // Signals ContextManager to compress
        }

        return true;
    }
}

export const tokenManager = new TokenManager();
