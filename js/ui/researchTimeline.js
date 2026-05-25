/**
 * LexisAI DAG Timeline Visualizer
 * Path: /js/ui/researchTimeline.js
 */
import { eventBus } from '../core/eventBus.js';

export class ResearchTimeline {
    constructor() {
        this.container = document.getElementById('timeline-nodes');
        if (!this.container) return;

        // Exact 15 stages from the LexisAI screenshot
        this.stages = [
            { id: 1, label: "PHASE 1: DISCOVERY", status: 'pending' },
            { id: 2, label: "PHASE 1: EXTRACTION", status: 'pending' },
            { id: 3, label: "PHASE 1: REFLECTION", status: 'pending' },
            { id: 4, label: "PHASE 1: INDEXING", status: 'pending' },
            { id: 5, label: "PHASE 1: GAP-FILL", status: 'pending' },
            { id: 6, label: "PHASE 1: COMPRESSION", status: 'pending' },
            { id: 7, label: "PHASE 1: VERIFICATION", status: 'pending' },
            { id: 8, label: "PHASE 2: GLOBAL SYNTHESIS", status: 'pending' },
            { id: 9, label: "PHASE 2: OUTLINING", status: 'pending' },
            { id: 10, label: "PHASE 2: RED-TEAM CRITIQUE", status: 'pending' },
            { id: 11, label: "PHASE 3: GENERATION", status: 'pending' },
            { id: 12, label: "PHASE 3: CITATION RESOLUTION", status: 'pending' },
            { id: 13, label: "PHASE 4: SMOOTHING", status: 'pending' },
            { id: 14, label: "PHASE 4: INTEGRITY AUDIT", status: 'pending' },
            { id: 15, label: "PHASE 4: FINAL AUDIT", status: 'pending' }
        ];

        this.updateHandler = this.updateTimeline.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('PROGRESS_UPDATE', this.updateHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);

        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        this.stages.forEach((stage) => {
            const node = document.createElement('div');
            
            // Dynamic styling based on status
            let dotColor = 'rgba(255,255,255,0.15)';
            let textColor = 'var(--text-muted)';
            let borderStyle = 'none';

            if (stage.status === 'active') {
                dotColor = 'var(--accent-glow)';
                textColor = '#fff';
                borderStyle = `0 0 10px var(--accent-glow)`;
            } else if (stage.status === 'complete') {
                dotColor = '#00f5d4'; // The green completion dot from your screenshot
                textColor = 'rgba(255,255,255,0.4)';
            }

            node.style.display = 'flex';
            node.style.alignItems = 'center';
            node.style.gap = '15px';
            node.style.marginBottom = '22px';
            node.style.transition = 'all 0.3s ease';

            node.innerHTML = `
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${dotColor}; box-shadow: ${borderStyle}; z-index: 2;"></div>
                <div style="font-size: 0.75rem; letter-spacing: 0.5px; color: ${textColor}; font-weight: ${stage.status === 'active' ? '600' : '500'};">${stage.label}</div>
            `;
            this.container.appendChild(node);
        });
    }

    updateTimeline(payload) {
        // Map current passes to the 15 exact nodes
        let activeStageId = 1;
        if (payload.pass >= 4) activeStageId = 2;
        if (payload.pass >= 5) activeStageId = 3;
        if (payload.pass >= 6) activeStageId = 4;
        if (payload.pass >= 7) activeStageId = 5;
        if (payload.pass >= 10) activeStageId = 6;
        if (payload.pass >= 11) activeStageId = 7;
        if (payload.pass >= 12) activeStageId = 8;
        if (payload.pass >= 13) activeStageId = 9;
        if (payload.pass >= 14) activeStageId = 10;
        if (payload.pass >= 15) activeStageId = 11;
        if (payload.pass >= 22) activeStageId = 12;
        if (payload.pass >= 23) activeStageId = 13;
        if (payload.pass >= 24) activeStageId = 14;
        if (payload.pass >= 25) activeStageId = 15;

        let changed = false;
        this.stages.forEach(stage => {
            let newStatus = 'pending';
            if (stage.id < activeStageId) newStatus = 'complete';
            if (stage.id === activeStageId) newStatus = 'active';

            if (stage.status !== newStatus) {
                stage.status = newStatus;
                changed = true;
            }
        });

        if (changed) this.render();
    }

    teardown() {
        eventBus.off('PROGRESS_UPDATE', this.updateHandler);
        eventBus.off('ROUTE_TEARDOWN', this.teardownHandler);
    }
}
