// js/engine/sourceManager.js
import { researchState } from './researchState.js';
import { eventBus } from '../core/eventBus.js';

class SourceManager {
    ingestSources(newSources) {
        if (!newSources || !Array.isArray(newSources)) return;

        // Flatten in case Tavily returned nested arrays
        const flatSources = newSources.flat();

        const currentSources = researchState.get('raw_sources') || [];
        
        // Deduplicate
        const existingUrls = new Set(currentSources.map(s => s.url));
        const uniqueNewSources = flatSources.filter(s => s && s.url && !existingUrls.has(s.url));

        const combinedSources = [...currentSources, ...uniqueNewSources];
        researchState.update('raw_sources', combinedSources);

        // Force a 500ms delay to ensure the UI DOM is fully painted before broadcasting
        setTimeout(() => {
            eventBus.publish('SOURCES_UPDATED', { 
                count: combinedSources.length,
                sources: combinedSources
            });
        }, 500);
    }

    getAllSources() {
        return researchState.get('raw_sources') || [];
    }
}

export const sourceManager = new SourceManager();
