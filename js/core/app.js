// js/core/app.js
import { CONFIG } from './config.js';
import { router } from './router.js';
import { eventBus } from './eventBus.js';
import { researchState } from '../engine/researchState.js';

// WAKE UP COMMANDS: These imports force the controllers to turn on and listen
import '../engine/oraclePipeline.js';
import '../ui/researchFeed.js';
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/thinkingVisualization.js';
import '../ui/reportViewer.js';

class LexisApp {
    constructor() {
        this.init();
    }

    init() {
        console.log(`[${CONFIG.APP_NAME}] Initializing OS v${CONFIG.VERSION}...`);
        
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handleGlobalPromiseRejection);

        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/') {
                this.bindQueryForm();
            }
        });

        router.handleRoute();
    }

    bindQueryForm() {
        const form = document.getElementById('query-form');
        const input = document.getElementById('main-search-input');
        
        if (form && input) {
            // Clone to prevent duplicate event listeners on re-routing
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            const newInput = document.getElementById('main-search-input');

            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = newInput.value.trim();
                if (query) {
                    researchState.update('user_prompt', query);
                    router.navigateTo('/research');
                    
                    setTimeout(() => {
                        eventBus.publish('RESEARCH_INITIATED', { query });
                    }, 500);
                }
            });
        }
    }

    handleGlobalError(event) {
        console.error(`[${CONFIG.APP_NAME} Critical]`, event.error);
        researchState.failures.push(`Syntax/DOM Error: ${event.message}`);
    }

    handleGlobalPromiseRejection(event) {
        console.error(`[${CONFIG.APP_NAME} Async Critical]`, event.reason);
        researchState.failures.push(`Async Engine Error: ${event.reason}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lexisApp = new LexisApp();
});
