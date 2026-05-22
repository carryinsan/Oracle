// js/ui/researchFeed.js
import { eventBus } from '../core/eventBus.js';

class ResearchFeed {
    constructor() {
        this.container = null;
        this.taskDisplay = null;
        this.init();
    }

    init() {
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.container = document.getElementById('live-log-container');
                this.taskDisplay = document.getElementById('current-task-display');
            }
        });

        eventBus.subscribe('STAGE_CHANGED', (data) => {
            if (this.taskDisplay) {
                this.taskDisplay.textContent = `Executing ${data.stage} (Pass ${data.pass})`;
            }
            this.appendLog(`[SYSTEM] Initializing ${data.stage}...`, 'system');
        });

        eventBus.subscribe('PIPELINE_ACTION', (data) => {
            this.appendLog(`> ${data.action}`, 'action');
        });

        eventBus.subscribe('LLM_CHUNK_RECEIVED', (data) => {
            this.appendStreamChunk(data.text);
        });
    }

    appendLog(message, type = 'default') {
        if (!this.container) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `stream-chunk log-${type}`;
        logEntry.style.marginBottom = '0.5rem';
        logEntry.style.color = type === 'system' ? 'var(--glow-accent)' : 'var(--text-secondary)';
        logEntry.style.fontFamily = 'var(--font-mono)';
        logEntry.style.fontSize = '0.9rem';
        logEntry.textContent = message;

        this.container.appendChild(logEntry);
        this.scrollToBottom();
    }

    appendStreamChunk(text) {
        if (!this.container) return;

        const span = document.createElement('span');
        span.className = 'stream-chunk';
        span.textContent = text;
        
        this.container.appendChild(span);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }
}

export const researchFeed = new ResearchFeed();
