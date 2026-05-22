// js/ui/researchTimeline.js
import { eventBus } from '../core/eventBus.js';

class ResearchTimeline {
    constructor() {
        this.container = null;
        this.activeNode = null;
        this.init();
    }

    init() {
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                this.container = document.getElementById('timeline-container');
                this.renderInitialNodes();
            }
        });

        eventBus.subscribe('STAGE_CHANGED', (data) => {
            this.updateActiveNode(data.stage);
        });
    }

    renderInitialNodes() {
        if (!this.container) return;
        this.container.innerHTML = ''; 

        const stages = [
            'PHASE 1: DISCOVERY', 'PHASE 1: EXTRACTION', 'PHASE 1: REFLECTION', 
            'PHASE 1: INDEXING', 'PHASE 1: GAP-FILL', 'PHASE 1: COMPRESSION', 'PHASE 1: VERIFICATION',
            'PHASE 2: GLOBAL SYNTHESIS', 'PHASE 2: OUTLINING', 'PHASE 2: RED-TEAM CRITIQUE',
            'PHASE 3: GENERATION', 'PHASE 3: CITATION RESOLUTION',
            'PHASE 4: SMOOTHING', 'PHASE 4: INTEGRITY AUDIT', 'PHASE 4: FINAL AUDIT'
        ];

        stages.forEach((stage, index) => {
            const node = document.createElement('div');
            node.className = 'timeline-node';
            node.dataset.stage = stage;
            node.style.padding = '10px 0';
            node.style.borderLeft = '2px solid var(--border-subtle)';
            node.style.paddingLeft = '15px';
            node.style.position = 'relative';
            node.style.color = 'var(--text-secondary)';
            node.style.fontSize = '0.85rem';
            node.style.transition = 'all 0.3s ease';
            
            node.innerHTML = `
                <div class="node-indicator" style="position: absolute; left: -6px; top: 15px; width: 10px; height: 10px; border-radius: 50%; background: var(--border-subtle); transition: all 0.3s ease;"></div>
                ${stage}
            `;
            this.container.appendChild(node);
        });
    }

    updateActiveNode(currentStage) {
        if (!this.container) return;

        const nodes = Array.from(this.container.children);
        let foundCurrent = false;

        nodes.forEach(node => {
            const indicator = node.querySelector('.node-indicator');
            if (node.dataset.stage === currentStage) {
                node.style.color = 'var(--text-primary)';
                node.style.fontWeight = 'bold';
                indicator.style.background = 'var(--glow-accent)';
                indicator.style.boxShadow = '0 0 10px var(--glow-accent)';
                foundCurrent = true;
            } else if (!foundCurrent) {
                // Completed nodes
                node.style.color = 'var(--text-secondary)';
                node.style.fontWeight = 'normal';
                indicator.style.background = 'var(--success-color)';
                indicator.style.boxShadow = 'none';
            }
        });
    }
}

export const researchTimeline = new ResearchTimeline();
