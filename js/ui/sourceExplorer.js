/**
 * LexisAI Live Source Dropdown UI
 * Path: /js/ui/sourceExplorer.js
 */
import { eventBus } from '../core/eventBus.js';

export class SourceExplorer {
    constructor() {
        // Only initialize if we are on the research page
        if (!document.querySelector('.execution-main')) return;

        this.sourceCount = 0;
        this.isOpen = false;
        
        this.buildUI();

        this.updateHandler = this.updateCount.bind(this);
        this.discoverHandler = this.addSource.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('SOURCE_COUNT_UPDATED', this.updateHandler);
        eventBus.on('SOURCE_DISCOVERED', this.discoverHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);
    }

    buildUI() {
        // Create the Floating Button
        this.btn = document.createElement('button');
        this.btn.id = 'source-explorer-btn';
        this.btn.innerHTML = `Researching <span id="se-count">0</span> Sources <span>▼</span>`;
        Object.assign(this.btn.style, {
            position: 'absolute', top: '30px', right: '40px',
            background: 'var(--surface-glass)', border: '1px solid var(--accent-glow)',
            color: '#fff', padding: '10px 20px', borderRadius: '8px',
            cursor: 'pointer', zIndex: '100', backdropFilter: 'blur(10px)',
            display: 'flex', gap: '10px', alignItems: 'center', fontWeight: '600'
        });

        // Create the Dropdown Panel
        this.panel = document.createElement('div');
        this.panel.id = 'source-explorer-panel';
        Object.assign(this.panel.style, {
            position: 'absolute', top: '80px', right: '40px',
            width: '400px', maxHeight: '500px', overflowY: 'auto',
            background: 'var(--surface-glass)', border: '1px solid var(--border-glass)',
            borderRadius: '8px', padding: '15px', zIndex: '99', backdropFilter: 'blur(16px)',
            display: 'none', flexDirection: 'column', gap: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        });

        document.querySelector('.execution-main').appendChild(this.btn);
        document.querySelector('.execution-main').appendChild(this.panel);

        this.btn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            this.panel.style.display = this.isOpen ? 'flex' : 'none';
        });
    }

    updateCount(payload) {
        this.sourceCount = payload.total;
        const countSpan = document.getElementById('se-count');
        if (countSpan) countSpan.innerText = this.sourceCount;
    }

    addSource(payload) {
        if (!this.panel) return;
        
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px', background: 'rgba(0,0,0,0.3)',
            borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)'
        });

        row.innerHTML = `
            <img src="${payload.icon}" alt="logo" style="width: 24px; height: 24px; border-radius: 4px;">
            <div style="flex-grow: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                <span style="color: #e2e8f0; font-size: 0.9rem;">${payload.title}</span><br>
                <span style="color: var(--text-muted); font-size: 0.75rem;">${payload.domain}</span>
            </div>
            <a href="${payload.url}" target="_blank" style="color: var(--accent-glow); text-decoration: none; font-size: 0.85rem;">[↗]</a>
        `;
        
        this.panel.prepend(row); // Add newest to top
    }

    teardown() {
        eventBus.off('SOURCE_COUNT_UPDATED', this.updateHandler);
        eventBus.off('SOURCE_DISCOVERED', this.discoverHandler);
        eventBus.off('ROUTE_TEARDOWN', this.teardownHandler);
    }
}
