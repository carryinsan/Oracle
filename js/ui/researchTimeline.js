/**
 * LexisAI DAG Timeline Visualizer
 * Path: /js/ui/researchTimeline.js
 */
import { eventBus } from '../core/eventBus.js';

export class ResearchTimeline {
    constructor() {
        this.container = document.getElementById('timeline-nodes');
        if (!this.container) return;

        this.stages = [
            { id: 1, label: "DAG Mapping & Planning", status: 'pending' },
            { id: 2, label: "Parallel Web Ingestion", status: 'pending' },
            { id: 3, label: "Epistemological Extraction", status: 'pending' },
            { id: 4, label: "Contradiction Resolution", status: 'pending' },
            { id: 5, label: "DeepSeek Synthesis", status: 'pending' },
            { id: 6, label: "Cryptographic Assembly", status: 'pending' }
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

        this.stages.forEach((stage, index) => {
            const node = document.createElement('div');
            
            // Dynamic styling based on status
            let dotColor = 'rgba(255,255,255,0.2)';
            let textColor = 'var(--text-muted)';
            let borderStyle = 'none';

            if (stage.status === 'active') {
                dotColor = 'var(--accent-glow)';
                textColor = '#fff';
                borderStyle = `0 0 10px var(--accent-glow)`;
            } else if (stage.status === 'complete') {
                dotColor = '#8338ec';
                textColor = '#cbd5e1';
            }

            node.style.display = 'flex';
            node.style.alignItems = 'center';
            node.style.gap = '15px';
            node.style.marginBottom = '20px';
            node.style.opacity = stage.status === 'pending' ? '0.5' : '1';
            node.style.transition = 'all 0.4s ease';

            node.innerHTML = `
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${dotColor}; box-shadow: ${borderStyle};"></div>
                <div style="font-size: 0.9rem; color: ${textColor}; font-weight: ${stage.status === 'active' ? '600' : '400'};">${stage.label}</div>
            `;
            this.container.appendChild(node);
        });
    }

    updateTimeline(payload) {
        // Map 40 passes to the 6 macro-stages for UI clarity
        let activeStageId = 1;
        if (payload.pass >= 4) activeStageId = 2;
        if (payload.pass >= 13) activeStageId = 3;
        if (payload.pass >= 14) activeStageId = 4;
        if (payload.pass >= 24) activeStageId = 5;
        if (payload.pass >= 31) activeStageId = 6;

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
