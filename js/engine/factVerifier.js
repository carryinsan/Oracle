/**
 * LexisAI Strict Fact Validation Gate
 * Path: /js/engine/factVerifier.js
 */
import { eventBus } from '../core/eventBus.js';

export class FactVerifier {
    static isValidClaim(claimText, sourceUrl) {
        // Drop empty claims
        if (!claimText || claimText.trim().length < 10) return false;
        
        // Anti-Hallucination: Reject claims that admit they have no source
        const hallucinationMarkers = ["i don't have", "as an ai", "cannot verify", "unverifiable"];
        const lowerClaim = claimText.toLowerCase();
        
        if (hallucinationMarkers.some(marker => lowerClaim.includes(marker))) {
            eventBus.emit('TERMINAL_LOG', { message: `[VERIFIER] Rejected hallucinated claim from memory buffer.` });
            return false;
        }

        // Anti-Spam: Ensure URL is somewhat valid
        if (!sourceUrl || !sourceUrl.startsWith('http')) return false;

        return true;
    }
}
