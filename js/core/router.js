/**
 * LexisAI Native SPA Router
 * Path: /js/core/router.js
 */

import { eventBus } from './eventBus.js';
import { CONFIG } from './config.js';

class Router {
    constructor() {
        this.appRoot = document.getElementById('app-root');
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const targetPage = CONFIG.ROUTES[hash] || 'index.html';

        try {
            // 1. Trigger Ghost-Listener Teardown across all active UI components
            eventBus.emit('ROUTE_TEARDOWN');

            // 2. Fetch the new static HTML shell
            const response = await fetch(targetPage);
            if (!response.ok) throw new Error(`Virtual route missing: ${targetPage}`);
            
            const htmlText = await response.text();
            
            // 3. Extract purely the <main> block to avoid <head> duplication
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const newRoot = doc.getElementById('app-root');
            
            if (newRoot) {
                // Smooth Cinematic Transition (Avoid destructive immediate innerHTML swaps)
                this.appRoot.style.transition = `opacity ${CONFIG.ANIMATION_SPEED_MS}ms ease`;
                this.appRoot.style.opacity = '0';
                
                setTimeout(() => {
                    this.appRoot.innerHTML = newRoot.innerHTML;
                    this.appRoot.style.opacity = '1';
                    
                    // 4. Signal UI controllers to bind to the new DOM safely
                    eventBus.emit('DOM_READY', { route: hash });
                }, CONFIG.ANIMATION_SPEED_MS);
            } else {
                // Failsafe fallback
                window.location.href = targetPage;
            }
        } catch (error) {
            eventBus.emit('FATAL_ERROR', { message: `Routing Engine Failure: ${error.message}` });
        }
    }

    navigate(hash) {
        // "Same-Hash" Trap Prevention: Force execution even if URL hasn't changed
        if (window.location.hash === hash) {
            this.handleRoute();
        } else {
            window.location.hash = hash;
        }
    }
}

export const router = new Router();
