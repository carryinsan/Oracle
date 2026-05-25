/**
 * LexisAI Search Batch Orchestrator
 * Path: /js/api/tavilySearch.js
 */
import { TavilyClient } from './tavilyClient.js';
import { TavilyCompressor } from './tavilyCompressor.js';
import { eventBus } from '../core/eventBus.js';

export class TavilySearch {
    static async executeBatch(queriesArray) {
        if (!Array.isArray(queriesArray) || queriesArray.length === 0) return [];
        
        try {
            // Log EXACTLY like the screenshot before firing
            queriesArray.forEach(q => {
                eventBus.emit('TERMINAL_LOG', { message: `> Executing Search: "${q}"` });
            });

            const searchPromises = queriesArray.map(q => TavilyClient.executeQuery(q));
            const rawResults = await Promise.all(searchPromises);
            
            let compressedMasterList = [];
            
            rawResults.forEach(raw => {
                const compressed = TavilyCompressor.process(raw);
                compressedMasterList.push(...compressed);
            });

            const uniqueSources = Array.from(new Map(compressedMasterList.map(item => [item.url, item])).values());
            return uniqueSources;
            
        } catch (error) {
            // DO NOT throw fatal error, degrade gracefully so pipeline survives
            eventBus.emit('TERMINAL_LOG', { message: `> API Search Exhaustion: ${error.message}` });
            return []; 
        }
    }
}
