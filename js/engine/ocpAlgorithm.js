// File Path: js/engine/ocpAlgorithm.js
// Purpose: Client-side intelligent text mutation engine. Parses TARGET/REPLACEMENT 
// outputs from Pass 25 and applies them resiliently to the master draft.

import { stateManager } from './researchState.js';
import { EventBus } from '../core/eventBus.js';

export class OcpAlgorithm {
    /**
     * Executes the algorithmic string replacement for the final audit.
     * @returns {Promise<string>} The finalized, error-corrected master report.
     */
    static async execute() {
        let fullDraft = stateManager.get('draft.all_passes') || "";
        const replacementsRaw = stateManager.get('final_replacements') || ""; // Raw string from Pass 25

        if (!fullDraft || !replacementsRaw) {
            EventBus.emit('TELEMETRY_LOG', "[OCP Algorithm] No drafts or replacements found. Bypassing.");
            return fullDraft;
        }

        // 1. Parse the Pass 25 output into executable key-value pairs
        const replacementPairs = this.parseReplacements(replacementsRaw);
        
        if (replacementPairs.length === 0) {
            EventBus.emit('TELEMETRY_LOG', "[OCP Algorithm] Zero actionable OCP directives detected. Draft is pristine.");
            return fullDraft;
        }

        EventBus.emit('TELEMETRY_LOG', `[OCP Algorithm] Initializing execution of ${replacementPairs.length} string mutations...`);

        // 2. Apply mutations using resilient string matching
        let successCount = 0;
        replacementPairs.forEach((pair, index) => {
            const { target, replacement } = pair;
            
            // Attempt exact match first
            if (fullDraft.includes(target)) {
                fullDraft = fullDraft.replace(target, replacement);
                successCount++;
                EventBus.emit('TELEMETRY_LOG', `[OCP Sub-routine] Mutation ${index + 1} applied successfully (Exact Match).`);
            } else {
                // Fallback: Resilient matching (ignores whitespace/newline differences)
                const normalizedTarget = this.normalizeText(target);
                const regex = new RegExp(this.escapeRegExp(normalizedTarget).replace(/\s+/g, '\\s+'), 'i');
                
                if (regex.test(fullDraft)) {
                    fullDraft = fullDraft.replace(regex, replacement);
                    successCount++;
                    EventBus.emit('TELEMETRY_LOG', `[OCP Sub-routine] Mutation ${index + 1} applied successfully (Resilient Match).`);
                } else {
                    EventBus.emit('TELEMETRY_LOG', `[WARNING] Mutation ${index + 1} target string not found in master draft. Dropped.`);
                }
            }
        });

        EventBus.emit('TELEMETRY_LOG', `[OCP Algorithm] Compilation complete. ${successCount}/${replacementPairs.length} mutations executed.`);
        
        return fullDraft;
    }

    /**
     * Parses the strict 'TARGET: ... \n REPLACEMENT: ...' format from Gemini.
     */
    static parseReplacements(rawText) {
        const pairs = [];
        const blocks = rawText.split(/TARGET:/i).filter(b => b.trim().length > 0);

        blocks.forEach(block => {
            const split = block.split(/REPLACEMENT:/i);
            if (split.length === 2) {
                pairs.push({
                    target: split[0].trim(),
                    replacement: split[1].trim()
                });
            }
        });

        return pairs;
    }

    static normalizeText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
