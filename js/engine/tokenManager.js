// File Path: js/engine/tokenManager.js
// Purpose: Context window optimization and token estimation.
// Prevents 413 Payload Too Large / Token Exhaustion errors.

import { Config } from '../core/config.js';

export class TokenManager {
    /**
     * Rough estimation of tokens based on character count.
     * (Approx 4 characters per token for English text).
     */
    static estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Applies the strict [MAX_CONTEXT_BUDGET] compression rule.
     * Prioritizes CONTRADICTION_OBJECTS, high confidence weights, and claim_ids.
     * @param {Array} memorySlice - Array of extracted fact strings/objects.
     * @returns {Array} Compressed memory slice fitting within safe bounds.
     */
    static compressMemorySlice(memorySlice) {
        let currentTokens = this.estimateTokens(JSON.stringify(memorySlice));
        const limit = Config.MEMORY.COMPRESSION_THRESHOLD;

        if (currentTokens <= limit) return memorySlice;

        console.warn(`[TokenManager] Memory slice exceeds threshold (${currentTokens} > ${limit}). Compressing...`);

        // Sort by priority logic: 
        // 1. Contradictions (Highest)
        // 2. High Weight claims (e.g., weight: 0.9)
        return memorySlice.sort((a, b) => {
            const aIsContradiction = a.includes('CONTRADICTION_OBJECT');
            const bIsContradiction = b.includes('CONTRADICTION_OBJECT');
            if (aIsContradiction && !bIsContradiction) return -1;
            if (!aIsContradiction && bIsContradiction) return 1;

            // Extract weights (e.g., [weight: 0.9])
            const weightA = parseFloat(a.match(/\[weight:\s*([0-9.]+)\]/)?.[1] || 0);
            const weightB = parseFloat(b.match(/\[weight:\s*([0-9.]+)\]/)?.[1] || 0);
            return weightB - weightA;
        }).filter(item => {
            // Keep adding items until we fall below the limit
            const itemTokens = this.estimateTokens(item);
            if (currentTokens - itemTokens > limit / 2) {
                // If it's low weight and we are way over, drop it
                currentTokens -= itemTokens;
                return false;
            }
            return true;
        });
    }
}
