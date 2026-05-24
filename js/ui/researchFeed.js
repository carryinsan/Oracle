// js/ui/researchFeed.js
import { eventBus } from '../core/eventBus.js';

class ResearchFeed {
    constructor() {
        this.container = null;
        this.taskDisplay = null;
        this.init();
    }

    init() {
        // Late-Binding: Wait for the router to announce the page is ready
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.bindElements();
            }
        });

        eventBus.subscribe('PIPELINE_ACTION', (data) => {
            this.appendLog(`> ${data.action}`);
            if (this.taskDisplay) this.taskDisplay.textContent = data.action;
        });

        eventBus.subscribe('LLM_CHUNK_RECEIVED', (data) => {
            this.appendChunk(data.text);
        });
        
        eventBus.subscribe('PIPELINE_ERROR', (data) => {
             this.appendLog(`[FATAL ERROR] ${data.error}`, true);
             if (this.taskDisplay) {
                 this.taskDisplay.textContent = "Pipeline Halted Due To Error.";
                 this.taskDisplay.style.color = "#ef4444"; 
             }
        });
    }

    bindElements() {
        this.container = document.getElementById('live-log-container');
        this.taskDisplay = document.getElementById('current-task-display');
    }

    appendLog(text, isError = false) {
        if (!this.container) return;
        const entry = document.createElement('div');
        entry.style.marginBottom = '8px';
        entry.style.color = isError ? '#ef4444' : 'var(--text-secondary)';
        entry.textContent = text;
        this.container.appendChild(entry);
        this.scrollToBottom();
    }

    appendChunk(text) {
        if (!this.container) return;
        // Basic streaming text append
        const lastChild = this.container.lastElementChild;
        if (lastChild && !lastChild.textContent.startsWith('> ') && !lastChild.textContent.startsWith('[')) {
             lastChild.textContent += text;
        } else {
             const entry = document.createElement('div');
             entry.style.marginBottom = '8px';
             entry.style.color = 'var(--text-primary)';
             entry.textContent = text;
             this.container.appendChild(entry);
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }
}

export const researchFeed = new ResearchFeed();
