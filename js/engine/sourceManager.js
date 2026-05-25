/**
 * LexisAI Data Ingestion Engine
 * Path: /js/engine/sourceManager.js
 */
import { state } from './researchState.js';
import { eventBus } from '../core/eventBus.js';

export class SourceManager {
    static ingest(newSourcesArray) {
        if (!Array.isArray(newSourcesArray)) return;

        // Deduplicate against existing memory
        const existingUrls = new Set(state.rawSources.map(s => s.url));
        const uniqueNewSources = newSourcesArray.filter(s => !existingUrls.has(s.url));

        state.rawSources.push(...uniqueNewSources);

        // Update UI Button live tracker
        eventBus.emit('SOURCE_COUNT_UPDATED', { 
            total: state.rawSources.length 
        });

        console.log(`[INGESTION] Added ${uniqueNewSources.length} unique sources. Total: ${state.rawSources.length}`);
    }

    static getAllRawText() {
        return JSON.stringify(state.rawSources.map(s => ({ url: s.url, text: s.text })));
    }
}
