/**
 * LexisAI Formatting & Integrity Controller
 * Path: /js/engine/qualityController.js
 */
export class QualityController {
    static sanitizeDraft(draftText) {
        let safeText = draftText;
        
        // Failsafe: Eradicate markdown tables if the LLM hallucinated them despite prompt constraints
        if (safeText.includes('|') && safeText.includes('---')) {
            console.warn("[QUALITY_CTRL] Markdown table detected. Scrubbing formatting.");
            safeText = safeText.replace(/\|.*\|/g, ''); // Strip table rows
            safeText += "\n\n> *Note: Tabular data was detected and stripped for strict format compliance.*";
        }

        return safeText;
    }
}
