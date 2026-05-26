// File Path: js/ui/researchFeed.js
// Purpose: Cinematic terminal output for system telemetry. Builds user trust via transparency.

import { EventBus } from '../core/eventBus.js';
import { Config } from '../core/config.js';

class ResearchFeed {
    constructor() {
        this.container = document.getElementById('live-feed-container');
        this.isStreaming = false;
        this.queue = [];
        
        if (this.container) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Listen for internal system logs
        EventBus.on('TELEMETRY_LOG', (message) => {
            this.queueLog(`> ${this.getTimestamp()} - ${message}`);
        });

        // Listen for state updates to display dynamic data ingestion
        EventBus.on('STATE_UPDATED', (payload) => {
            if (payload.path.includes('memory_index')) {
                this.queueLog(`> ${this.getTimestamp()} - [MEMORY] Anchored new cryptographic claims to semantic index.`);
            }
        });
    }

    getTimestamp() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    }

    queueLog(message) {
        this.queue.push(message);
        if (!this.isStreaming) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isStreaming = false;
            return;
        }

        this.isStreaming = true;
        const message = this.queue.shift();
        
        const line = document.createElement('div');
        line.className = 'feed-line streaming-text';
        this.container.appendChild(line);

        // Cinematic Typing Effect
        for (let i = 0; i < message.length; i++) {
            line.textContent += message.charAt(i);
            this.scrollToBottom();
            // Fast delay for technical readouts
            await this.sleep(Config.UI.STREAM_SPEED_MS); 
        }

        line.classList.remove('streaming-text');
        
        // Keep DOM light by removing old logs (prevent memory leak)
        if (this.container.children.length > 100) {
            this.container.removeChild(this.container.firstChild);
        }

        this.processQueue();
    }

    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const feedUI = new ResearchFeed();
