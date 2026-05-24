// js/ui/researchTimeline.js
import { eventBus } from '../core/eventBus.js';

class ResearchTimeline {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
         // Late-Binding: Wait for the router to announce the page is ready
         eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.bindElements();
                this.renderInitialTimeline();
            }
        });

        eventBus.subscribe('PIPELINE_ACTION', (data) => {
            this.highlightNode(data.action);
        });
    }

    bindElements() {
        this.container = document.getElementById('timeline-container');
    }

    renderInitialTimeline() {
        if (!this.container) return;
        const phases = [
            "PHASE 1: DISCOVERY",
            "PHASE 1: EXTRACTION",
            "PHASE 1: REFLECTION",
            "PHASE 1: INDEXING",
            "PHASE 1: GAP-FILL",
            "PHASE 1: COMPRESSION",
            "PHASE 1: VERIFICATION",
            "PHASE 2: GLOBAL SYNTHESIS",
            "PHASE 2: OUTLINING",
            "PHASE 2: RED-TEAM CRITIQUE",
            "PHASE 3: GENERATION",
            "PHASE 3: CITATION RESOLUTION",
            "PHASE 4: SMOOTHING",
            "PHASE 4: INTEGRITY AUDIT",
            "PHASE 4: FINAL AUDIT"
        ];
        
        this.container.innerHTML = phases.map(phase => `
            <div class="timeline-node" data-phase="${phase}" style="margin-bottom: 1rem; color: var(--text-secondary); opacity: 0.5; transition: all 0.3s ease;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:currentColor; margin-right:8px;"></span>
                ${phase}
            </div>
        `).join('');
    }

    highlightNode(actionText) {
        if (!this.container) return;
        const nodes = this.container.querySelectorAll('.timeline-node');
        
        // Very basic matching logic for the demo
        let targetPhase = null;
        if (actionText.includes('DISCOVERY') || actionText.includes('Searches')) targetPhase = "PHASE 1: DISCOVERY";
        // ... add other matchers based on your pipeline output ...

        if (targetPhase) {
             nodes.forEach(node => {
                 if (node.dataset.phase === targetPhase) {
                     node.style.color = 'var(--glow-accent)';
                     node.style.opacity = '1';
                     node.style.fontWeight = 'bold';
                 } else {
                     node.style.color = 'var(--text-secondary)';
                     node.style.opacity = '0.5';
                     node.style.fontWeight = 'normal';
                 }
             });
        }
    }
}

export const researchTimeline = new ResearchTimeline();
