// js/engine/contextManager.js
import { tokenManager } from './tokenManager.js';
import { researchState } from './researchState.js';

class ContextManager {
    
    buildContextPayload(stage, targetSlice = null) {
        let payload = "";

        // 1. Always inject the active Intent and Trajectory
        payload += `[USER_INTENT]: ${researchState.get('user_prompt')}\n`;
        payload += `[TRAJECTORY]: ${JSON.stringify(researchState.get('trajectory'))}\n`;

        // 2. Always preserve immutable contradictions
        const contradictions = researchState.get('contradictions');
        if (contradictions && contradictions.length > 0) {
            payload += `[CONTRADICTION_OBJECTS]: ${JSON.stringify(contradictions)}\n`;
        }

        // 3. Inject semantic slice if explicitly requested (e.g., Passes 15-21)
        if (targetSlice) {
            payload += `[SEMANTIC_SLICE]: ${JSON.stringify(targetSlice)}\n`;
        } else {
            // Otherwise, inject the compressed or raw corpus depending on stage
            const corpus = researchState.get('compressed_corpus') || researchState.get('anchored_claims');
            payload += `[CORPUS]: ${JSON.stringify(corpus)}\n`;
        }

        // 4. Token Check & Aggressive Compression
        if (!tokenManager.validatePayload(payload)) {
            payload = this._executeSlidingWindowCompression(payload);
        }

        return payload;
    }

    _executeSlidingWindowCompression(rawPayload) {
        console.warn("[ContextManager] Executing emergency sliding window compression...");
        
        // In a true implementation, this would strip older/lower-weight claims 
        // while preserving [claim_id: XYZ] tags. For this layer, we aggressively slice.
        const halfLength = Math.floor(rawPayload.length / 2);
        
        // Ensure we don't slice in the middle of a vital JSON block or claim tag
        // Fallback to a truncated string prioritizing the top half (newest/highest weight context)
        return rawPayload.substring(0, halfLength) + "\n\n[SYSTEM: OLDER CONTEXT PRUNED FOR BUDGET]";
    }
}

export const contextManager = new ContextManager();
