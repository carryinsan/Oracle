/**
 * LexisAI Live Terminal Feed Controller
 * Path: /js/ui/researchFeed.js
 */
import { eventBus } from '../core/eventBus.js';

export class ResearchFeed {
    constructor() {
        this.container = document.getElementById('live-feed-container');
        if (!this.container) return;

        // Bind with strict reference for teardown
        this.logHandler = this.appendLog.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('TERMINAL_LOG', this.logHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);
    }

    appendLog(payload) {
        if (!this.container) return;
        
        try {
            const logEntry = document.createElement('div');
            logEntry.style.marginBottom = '8px';
            logEntry.style.opacity = '0';
            logEntry.style.transform = 'translateY(5px)';
            logEntry.style.transition = 'all 0.3s ease';
            
            // Format timestamp
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            logEntry.innerHTML = `<span style="color: var(--accent-glow);">[${timeString}]</span> ${payload.message}`;
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
