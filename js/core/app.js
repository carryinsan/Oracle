// File Path: js/core/app.js
// Purpose: Main initialization module. Binds UI to the EventBus and bootstraps LexisAI.

import { Config } from './config.js';
import { EventBus } from './eventBus.js';

class LexisApp {
    constructor() {
        this.dom = {
            viewPrompt: document.getElementById('view-prompt'),
            viewPlan: document.getElementById('view-plan'),
            viewResearch: document.getElementById('view-research'),
            inputField: document.getElementById('research-input'),
            btnGeneratePlan: document.getElementById('btn-generate-plan'),
            btnStartResearch: document.getElementById('btn-start-research')
        };
        
        this.initialize();
    }

    initialize() {
        console.log(`[LexisAI] System Boot Sequence Initiated. Version: ${Config.VERSION}`);
        this.bindEvents();
        this.setupGlobalErrorHandling();
    }

    bindEvents() {
        // Handle User Input Submission
        this.dom.btnGeneratePlan.addEventListener('click', () => {
            const query = this.dom.inputField.value.trim();
            if (!query) return;

            // Transition UI
            this.switchView('view-plan');
            
            // Notify orchestration to begin Pass 1 (Think) & Pass 2 (Plan)
            EventBus.emit('UI_RESEARCH_INIT', { query });
        });

        // Handle Plan Confirmation (Moves to Execution phase)
        this.dom.btnStartResearch.addEventListener('click', () => {
            const approvedPlanHtml = document.getElementById('plan-editor-content').innerHTML;
            
            this.switchView('view-research');
            EventBus.emit('UI_PLAN_APPROVED', { planHtml: approvedPlanHtml });
        });

        // Listen for internal systemic resets (e.g., user wants to start over)
        EventBus.on('SYSTEM_RESET', () => {
            this.dom.inputField.value = '';
            this.switchView('view-prompt');
        });
    }

    /**
     * Handles cinematic view transitions by toggling active classes.
     * @param {string} viewId - The ID of the section to show.
     */
    switchView(viewId) {
        Object.values(this.dom).forEach(el => {
            if (el && el.classList && el.classList.contains('view-layer')) {
                el.classList.remove('active');
                el.classList.add('hidden');
            }
        });
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[LexisAI Global Error Guard]', event.reason);
            // In a production build, this would trigger a silent telemetry log
            // or an elegant UI failure notification to maintain trust.
        });
    }
}

// Bootstrap the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.LexisAI = new LexisApp();
});
