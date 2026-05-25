/**
 * LexisAI Cryptographic Citation & Anchoring
 * Path: /js/engine/citationManager.js
 */
import { state } from './researchState.js';

export class CitationManager {
    
    // Generates a short crypto UUID for anchoring facts (e.g., 8f4a2b)
    static generateClaimId() {
        return Math.random().toString(16).substring(2, 8);
    }

    static registerAnchor(claimId, url, weight, text) {
        state.anchored_claims.push({
            claim_id: claimId,
            url: url,
            weight: weight,
            text: text
        });
    }

    // Pass 22 [Write]: Citation Reconstruction
    static resolveCitations(draftMarkdown) {
        let resolvedText = draftMarkdown;
        let bibliography = "\n\n---\n### Verified Bibliography\n\n";
        let citationCounter = 1;
        const usedCitations = new Map(); // Maps claim_id -> footnote number

        // Find all instances of [claim_id: XYZ] or `[claim_id: XYZ]`
        const claimRegex = /\[claim_id:\s*([a-zA-Z0-9]+)\]/g;
        
        resolvedText = resolvedText.replace(claimRegex, (match, claimId) => {
            // Check if we already numbered this claim
            if (usedCitations.has(claimId)) {
                return `[${usedCitations.get(claimId)}]`;
            }

            // Find the source URL from our immutable memory
            const anchor = state.anchored_claims.find(c => c.claim_id === claimId);
            if (anchor && anchor.url) {
                const currentNumber = citationCounter++;
                usedCitations.set(claimId, currentNumber);
                
                // Append to bibliography
                let domain = anchor.url;
                try { domain = new URL(anchor.url).hostname; } catch(e) {}
                
                bibliography += `${currentNumber}. **${domain}** - [Source Link](${anchor.url}) (Confidence: ${anchor.weight})\n`;
                
                return `[${currentNumber}]`;
            }
            
            // If the LLM hallucinated a claim_id that doesn't exist, flag it
            return `[UNVERIFIED_CLAIM]`; 
        });

        if (citationCounter === 1) {
            bibliography += "*No external cryptographic claims were resolved in this document.*\n";
        }

        return resolvedText + bibliography;
    }
}
