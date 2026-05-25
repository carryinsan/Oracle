/**
 * LexisAI State Checkpointing & Recovery
 * Path: /js/engine/continuityManager.js
 */
import { state } from './researchState.js';

export class ContinuityManager {
    static checkpoint(phaseName) {
        try {
            const snapshot = state.getSnapshot();
            // Store a compressed version to prevent Quota limits
            const safeSnapshot = {
                query: snapshot.query,
                phase: phaseName,
                citations: snapshot.anchored_claims.length,
                outline: snapshot.sections.outline
            };
            localStorage.setItem('lexis_active_checkpoint', JSON.stringify(safeSnapshot));
            console.log(`[CHECKPOINT] State securely saved at phase: ${phaseName}`);
        } catch (e) {
            console.warn("[CHECKPOINT_FAILED] LocalStorage quota likely exceeded.");
        }
    }

    static clearCheckpoint() {
        localStorage.removeItem('lexis_active_checkpoint');
    }
}
