/**
 * LexisAI Context Builder
 * Path: /js/engine/contextManager.js
 */
import { TokenManager } from './tokenManager.js';

export class ContextManager {
    static buildPayload(systemInstruction, userContext) {
        const payload = [
            { role: "system", content: systemInstruction },
            { role: "user", content: userContext }
        ];
        
        TokenManager.deduct(payload);
        return payload;
    }

    static getSemanticSlice(clusterName) {
        // Prevents Context Poisoning by only returning the specific cluster requested
        return state.memory_index[clusterName] || "[SEMANTIC_SLICE_EMPTY]";
    }
}
