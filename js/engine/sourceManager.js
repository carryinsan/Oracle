// js/engine/sourceManager.js
import { researchState } from './researchState.js';

class SourceManager {
    ingestSources(newSources) {
        const currentRaw = researchState.get('raw') || [];
        const existingUrls = new Set(currentRaw.map(src => src.url));

        const uniqueNewSources = newSources.filter(src => {
            if (existingUrls.has(src.url)) return false;
            if (!src.content || src.content.length < 50) return false; // Drop empty/useless payloads
            
            existingUrls.add(src.url);
            return true;
        });

        const mergedSources = [...currentRaw, ...uniqueNewSources];
        researchState.update('raw', mergedSources);
        
        console.log(`[SourceManager] Ingested ${uniqueNewSources.length} new unique sources.`);
        return mergedSources;
    }

    getSourceByUrl(url) {
        const sources = researchState.get('raw') || [];
        return sources.find(src => src.url === url) || null;
    }
}

export const sourceManager = new SourceManager();
