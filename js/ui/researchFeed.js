/**
 * LexisAI Live Terminal Feed Controller
 * Path: /js/ui/researchFeed.js
 */
import { eventBus } from '../core/eventBus.js';

export class ResearchFeed {
    constructor() {
        this.container = document.getElementById('live-feed-container');
        if (!this.container) return;

        this.logHandler = this.appendLog.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('TERMINAL_LOG', this.logHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);
    }

    appendLog(payload) {
        if (!this.container) return;
        
        try {
            const logEntry = document.createElement('div');
            logEntry.style.opacity = '0';
            logEntry.style.transform = 'translateY(5px)';
            logEntry.style.transition = 'all 0.2s ease';
            
            let rawText = payload.message;
            let formattedHtml = '';

            // Exact Screenshot Parsing Logic
            if (rawText.startsWith('[SYSTEM]')) {
                formattedHtml = `<span style="color: var(--accent-glow); font-weight: 600;">${rawText}</span>`;
            } else if (rawText.startsWith('> Executing Search:')) {
                // Highlight search queries in slightly brighter text
                let styled = rawText.replace(/"(.*?)"/g, '<span style="color: #cbd5e1;">"$1"</span>');
                formattedHtml = `<span style="color: var(--text-muted);">${styled}</span>`;
            } else if (rawText.startsWith('> API Rate Limit')) {
                formattedHtml = `<span style="color: #475569;">${rawText}</span>`;
            } else if (rawText.startsWith('>')) {
                formattedHtml = `<span style="color: var(--text-muted);">${rawText}</span>`;
            } else {
                formattedHtml = `<span style="color: var(--text-muted);">${rawText}</span>`;
            }
            
            logEntry.innerHTML = formattedHtml;
            this.container.appendChild(logEntry);

            // Trigger reflow for animation
            void logEntry.offsetWidth; 
            logEntry.style.opacity = '1';
            logEntry.style.transform = 'translateY(0)';

            // Auto-scroll to bottom smoothly
            this.container.scrollTop = this.container.scrollHeight;
        } catch (e) {
            console.error("[UI_ERROR] Feed failed to render chunk.", e);
        }
    }

    teardown() {
        eventBus.off('TERMINAL_LOG', this.logHandler);
        eventBus.off('ROUTE_TEARDOWN', this.teardownHandler);
    }
}
