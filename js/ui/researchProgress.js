/**
 * LexisAI Cinematic Progress Controller
 * Path: /js/ui/researchProgress.js
 */
import { eventBus } from '../core/eventBus.js';

export class ResearchProgress {
    constructor() {
        this.bar = document.getElementById('master-progress-bar');
        this.label = document.getElementById('status-label');
        this.counter = document.getElementById('pass-counter');

        if (!this.bar) return;

        this.updateHandler = this.updateUI.bind(this);
        this.teardownHandler = this.teardown.bind(this);

        eventBus.on('PROGRESS_UPDATE', this.updateHandler);
        eventBus.on('ROUTE_TEARDOWN', this.teardownHandler);
    }

    updateUI(payload) {
        if (!this.bar || !this.label) return;

        try {
            this.bar.style.width = `${payload.percentage}%`;
            
            // EXACT SCREENSHOT HEADER FORMATTING: "Executing PHASE X: NAME (Pass Y)"
            this.label.innerText = `Executing ${payload.action} (Pass ${payload.pass})`;
            
            // Hide the old secondary counter since it's merged into the main H2 string now
            if (this.counter) {
                this.counter.style.display = 'none';
            }

            if (payload.percentage > 95) {
                this.bar.style.boxShadow = '0 0 20px var(--accent-green), 0 0 40px var(--accent-glow)';
            }
        } catch (e) {
            console.error("[UI_ERROR] Progress Bar Render Failure", e);
        }
    }

    teardown() {
        eventBus.off('PROGRESS_UPDATE', this.updateHandler);
        eventBus.off('ROUTE_TEARDOWN', this.teardownHandler);
    }
}
