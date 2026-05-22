// js/engine/citationManager.js
import { researchState } from './researchState.js';

class CitationManager {
    constructor() {
        this.citationMap = new Map();
    }

    generateClaimId() {
        // Native crypto API for collision-resistant UUIDs
        return crypto.randomUUID().split('-')[0]; 
    }

    registerClaim(url, textSnippet, confidenceWeight) {
        const claimId = this.generateClaimId();
        
        const claimObject = {
            claim_id: claimId,
            url: url,
            text: textSnippet,
            weight: confidenceWeight,
            timestamp: Date.now()
        };

        this.citationMap.set(claimId, claimObject);
        
        // Push to state for LLM context tracking
        const currentClaims = researchState.get('anchored_claims') || [];
        researchState.update('anchored_claims', [...currentClaims, claimObject]);

        return claimId;
    }

    resolveClaimToMarkdown(claimId, sequenceNumber) {
        const claim = this.citationMap.get(claimId);
        if (!claim) return `[Unresolved Citation]`;

        // Format for Pass 22: Citation Reconstruction
        return `^[${sequenceNumber}](url="${claim.url}" weight="${claim.weight}")^`;
    }

    buildBibliography() {
        const claims = researchState.get('anchored_claims') || [];
        const uniqueUrls = [...new Set(claims.map(c => c.url))];
        
        let bibliography = `\n\n### Documented Sources\n`;
        uniqueUrls.forEach((url, index) => {
            bibliography += `${index + 1}. ${url}\n`;
        });
        
        return bibliography;
    }
}

export const citationManager = new CitationManager();
