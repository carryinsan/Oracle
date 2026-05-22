// js/core/app.js
import { CONFIG } from './config.js';
import { router } from './router.js';
import { eventBus } from './eventBus.js';
import { researchState } from '../engine/researchState.js';

class LexisApp {
    constructor() {
        this.init();
    }

    init() {
        console.log(`[${CONFIG.APP_NAME}] Initializing OS v${CONFIG.VERSION}...`);
        
        // Global Error Boundary
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handleGlobalPromiseRejection);

        // Bind main input interceptor on the index route
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/') {
                this.bindQueryForm();
            }
        });

        // Trigger initial route load
        router.handleRoute();
    }

    bindQueryForm() {
        const form = document.getElementById('query-form');
        const input = document.getElementById('main-search-input');
        
        if (form && input) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    researchState.update('user_prompt', query);
                    router.navigateTo('/research');
                    
                    // Allow UI to transition before firing the heavy orchestration engine
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

// Bootstrap the OS
document.addEventListener('DOMContentLoaded', () => {
    window.lexisApp = new LexisApp();
});
