// js/engine/sourceManager.js
import { researchState } from './researchState.js';
import { eventBus } from '../core/eventBus.js';

class SourceManager {
    ingestSources(newSources) {
        if (!newSources || !Array.isArray(newSources)) return;

        const currentSources = researchState.get('raw_sources') || [];
        
        // Deduplicate sources based on URL to prevent bloating RAM
        const existingUrls = new Set(currentSources.map(s => s.url));
        const uniqueNewSources = newSources.filter(s => !existingUrls.has(s.url));

        const combinedSources = [...currentSources, ...uniqueNewSources];
        researchState.update('raw_sources', combinedSources);

        // Broadcast the live count and exact data to the UI
        eventBus.publish('SOURCES_UPDATED', { 
            count: combinedSources.length,
            sources: combinedSources
        });
    }

    getAllSources() {
        return researchState.get('raw_sources') || [];
    }
}

export const sourceManager = new SourceManager();
