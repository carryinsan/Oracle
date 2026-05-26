// File Path: js/ui/researchTimeline.js
// Purpose: Renders and animates the 25-pass Directed Acyclic Graph (DAG) on the UI.

import { Config } from '../core/config.js';
import { EventBus } from '../core/eventBus.js';

class ResearchTimeline {
    constructor() {
        this.container = document.getElementById('timeline-container');
        this.nodes = {};
        
        if (this.container) {
            this.initializeTimeline();
            this.bindEvents();
        }
    }

    initializeTimeline() {
        this.container.innerHTML = ''; // Clear any existing

        Config.PIPELINE_STAGES.forEach(stage => {
            const node = document.createElement('div');
            node.className = `timeline-node status-pending`;
            node.id = `node-pass-${stage.pass}`;
            
            node.innerHTML = `
                <div class="node-icon"></div>
                <div class="node-details">
                    <span class="node-pass-num">Pass ${stage.pass}</span>
                    <span class="node-name">${stage.name}</span>
                </div>
            `;
            
            this.container.appendChild(node);
            this.nodes[stage.pass] = node;
        });
    }

    bindEvents() {
        // When a pass starts, make it glow and pulse
        EventBus.on('PIPELINE_PASS_START', (payload) => {
            this.resetActiveNodes();
            const activeNode = this.nodes[payload.pass];
            
            if (activeNode) {
                activeNode.classList.remove('status-pending');
                activeNode.classList.add('active', 'status-running');
                
                // Auto-scroll the timeline container to keep the active node in view
                activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // When a pass finishes, mark it as successful
        EventBus.on('PIPELINE_PASS_COMPLETE', (payload) => {
            const completedNode = this.nodes[payload.pass];
            if (completedNode) {
                completedNode.classList.remove('active', 'status-running');
                completedNode.classList.add('status-complete');
            }
        });

        EventBus.on('PIPELINE_ERROR', (payload) => {
            const errorNode = this.nodes[payload.pass];
            if (errorNode) {
                errorNode.classList.remove('active', 'status-running');
                errorNode.classList.add('status-error');
            }
        });
    }

    resetActiveNodes() {
        Object.values(this.nodes).forEach(node => {
            node.classList.remove('active');
        });
    }
}

// Instantiate to bind automatically
export const timelineUI = new ResearchTimeline();
