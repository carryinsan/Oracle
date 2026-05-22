// js/ui/researchProgress.js
import { eventBus } from '../core/eventBus.js';
import { CONFIG } from '../core/config.js';

class ResearchProgress {
    constructor() {
        this.container = null;
        this.currentPass = 0;
        this.init();
    }

    init() {
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.container = document.getElementById('global-progress-ring');
                this.currentPass = 0;
                this.renderRing(0);
            }
        });

        eventBus.subscribe('STAGE_CHANGED', (data) => {
            // Extract the highest pass number from strings like "01-03" or "24"
            const passMatch = data.pass.match(/\d+/g);
            if (passMatch) {
                const maxPass = Math.max(...passMatch.map(Number));
                this.currentPass = maxPass;
                const percentage = Math.min(100, Math.round((this.currentPass / CONFIG.ORCHESTRATION.TOTAL_PASSES) * 100));
                this.renderRing(percentage);
            }
        });

        eventBus.subscribe('PIPELINE_COMPLETE', () => this.renderRing(100));
    }

    renderRing(percentage) {
        if (!this.container) return;
        
        // Simple visual representation using conic-gradient for the progress ring
        this.container.innerHTML = `
            <div style="
                width: 50px; 
                height: 50px; 
                border-radius: 50%; 
                background: conic-gradient(var(--glow-accent) ${percentage}%, var(--border-subtle) 0);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            ">
                <div style="
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    background: var(--color-surface);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: bold;
                ">
                    ${percentage}%
                </div>
            </div>
        `;
    }
}

export const researchProgress = new ResearchProgress();
