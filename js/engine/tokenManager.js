// File Path: js/engine/tokenManager.js
// Purpose: Heuristic token accounting and context budget enforcement.

import { Config } from '../core/config.js';

class TokenManager {
    constructor() {
        this.totalTokensUsed = 0;
    }

    /**
     * Heuristic estimation: 1 word ≈ 1.3 tokens for English text.
     * @param {string} text 
     * @returns {number}
     */
    estimateTokens(text) {
        if (!text) return 0;
        const words = text.trim().split(/\s+/).length;
        return Math.ceil(words * 1.3);
    }

    /**
     * Verifies if a payload is safe to send.
     * @param {string} payload 
     * @returns {boolean}
     */
    isWithinBudget(payload) {
        const tokens = this.estimateTokens(payload);
        return tokens < Config.MEMORY.MAX_CONTEXT_TOKENS;
    }

    trackUsage(inputText, outputText) {
        const used = this.estimateTokens(inputText) + this.estimateTokens(outputText);
        this.totalTokensUsed += used;
        console.log(`[TokenManager] Pass usage: ~${used} tokens. Total: ~${this.totalTokensUsed}`);
    }
}

export const tokenManager = new TokenManager();
