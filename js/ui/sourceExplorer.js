// File Path: js/ui/sourceExplorer.js
// Purpose: Manages the "Cryptographic Evidence" panel. Deduplicates and renders incoming sources dynamically.

import { EventBus } from '../core/eventBus.js';
import { stateManager } from '../engine/researchState.js';

class SourceExplorer {
    constructor() {
        this.container = document.getElementById('source-list-container');
        this.confidenceFill = document.getElementById('confidence-fill');
        this.seenUrls = new Set();
        this.totalSources = 0;
        
        if (this.container) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Listen for new search results being appended to the state
        EventBus.on('STATE_UPDATED', (payload) => {
            if (payload.path.startsWith('search_results.pass')) {
                this.processNewSources(payload.value);
            }
        });

        // Reset the UI when the system restarts
        EventBus.on('STATE_RESET', () => {
            this.container.innerHTML = '';
            this.seenUrls.clear();
            this.totalSources = 0;
            this.updateConfidenceMeter(0);
        });
    }

    processNewSources(rawResults) {
        if (!rawResults) return;
        
        let results = [];
        try {
            results = typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;
        } catch (e) {
            console.error("[SourceExplorer] Failed to parse incoming sources.", e);
            return;
        }

        if (!Array.isArray(results)) return;

        let addedCount = 0;

        results.forEach(source => {
            if (source.url && !this.seenUrls.has(source.url)) {
                this.seenUrls.add(source.url);
                this.totalSources++;
                addedCount++;
                this.renderSourceCard(source);
            }
        });

        if (addedCount > 0) {
            this.calculateAndSetConfidence();
        }
    }

    renderSourceCard(source) {
        const card = document.createElement('div');
        card.className = 'source-card animate-reveal';
        
        // Extract domain for cleaner display
        let domain = 'Source';
        try { domain = new URL(source.url).hostname.replace('www.', ''); } catch (e) {}

        card.innerHTML = `
            <div class="source-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <div class="source-info">
                <div class="source-title" title="${source.title || 'Encrypted Source'}">${source.title || 'Encrypted Source'}</div>
                <div class="source-url"><a href="${source.url}" target="_blank" rel="noopener noreferrer">${domain}</a></div>
            </div>
        `;

        this.container.appendChild(card);
        
        // Ensure new sources scroll into view smoothly
        this.container.scrollTop = this.container.scrollHeight;
    }

    calculateAndSetConfidence() {
        // Heuristic: 15+ unique, diverse sources = 99% confidence.
        // As the DAG pipeline executes, this bar will naturally fill up.
        let rawPercentage = (this.totalSources / 15) * 100;
        let percentage = Math.min(99, Math.max(5, rawPercentage)); // Cap at 99%
        
        this.updateConfidenceMeter(percentage);
    }

    updateConfidenceMeter(percentage) {
        if (this.confidenceFill) {
            this.confidenceFill.style.width = `${percentage}%`;
        }
    }
}

export const sourceUI = new SourceExplorer();
