// File Path: js/core/app.js
// Purpose: Main initialization module. Binds UI to the EventBus and bootstraps LexisAI.
// Includes bulletproof view isolation to prevent UI bleeding and overlap.

import { Config } from './config.js';
import { EventBus } from './eventBus.js';

class LexisApp {
    constructor() {
        // DOM Elements mapping
        this.dom = {
            inputField: document.getElementById('research-input'),
            btnGeneratePlan: document.getElementById('btn-generate-plan'),
            btnEditPlan: document.getElementById('btn-edit-plan'),
            btnStartResearch: document.getElementById('btn-start-research')
        };
        
        this.initialize();
    }

    initialize() {
        console.log(`[LexisAI] System Boot Sequence Initiated. Version: ${Config.VERSION}`);
        
        // Ensure the initial view is correctly set on load
        this.switchView('view-prompt');
        
        this.bindEvents();
        this.setupGlobalErrorHandling();
    }

    bindEvents() {
        // Handle Initial User Prompt Submission
        if (this.dom.btnGeneratePlan) {
            this.dom.btnGeneratePlan.addEventListener('click', () => {
                const query = this.dom.inputField.value.trim();
                if (!query) return;

                // Transition UI to Plan mode
                this.switchView('view-plan');
                
                // Notify orchestration to begin Pass 1 (Think) & Pass 2 (Plan)
                EventBus.emit('UI_RESEARCH_INIT', { query });
            });
        }

        // Handle Plan Confirmation (Moves to the 25-Pass Execution phase)
        if (this.dom.btnStartResearch) {
            this.dom.btnStartResearch.addEventListener('click', () => {
                const planEditor = document.getElementById('plan-editor-content');
                const approvedPlanHtml = planEditor ? planEditor.innerHTML : "";
                
                this.switchView('view-research');
                EventBus.emit('UI_PLAN_APPROVED', { planHtml: approvedPlanHtml });
            });
        }
        
        // Handle Plan Regeneration Request
        if (this.dom.btnEditPlan) {
            this.dom.btnEditPlan.addEventListener('click', () => {
                const query = this.dom.inputField.value.trim();
                EventBus.emit('UI_PLAN_REGENERATE', { query });
                
                const planEditor = document.getElementById('plan-editor-content');
                if (planEditor) planEditor.innerHTML = "<p>Regenerating strategic plan...</p>";
            });
        }

        // Listen for internal systemic resets (e.g., user wants to start over from Report View)
        EventBus.on('SYSTEM_RESET', () => {
            if (this.dom.inputField) this.dom.inputField.value = '';
            this.switchView('view-prompt');
        });
    }

    /**
     * Handles cinematic view transitions by strictly enforcing isolation.
     * Prevents the Flexbox collapse and view-bleeding bugs.
     * @param {string} viewId - The ID of the section to show.
     */
    switchView(viewId) {
        // 1. Force hide EVERY element with the class 'view-layer' across the entire document
        document.querySelectorAll('.view-layer').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });
        
        // 2. Activate ONLY the requested target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
        } else {
            console.error(`[LexisAI UI Error] Target view '${viewId}' was not found in the DOM.`);
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[LexisAI Global Error Guard]', event.reason);
            // In a production build, this would trigger a silent telemetry log
            // or an elegant UI failure notification to maintain trust.
            EventBus.emit('TELEMETRY_LOG', `[SYSTEM GUARD] Recovered from async exception: ${event.reason?.message || 'Unknown error'}`);
        });
    }
}

// Bootstrap the application when the DOM is fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    window.LexisAI = new LexisApp();
});
