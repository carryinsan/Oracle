// js/core/router.js
import { eventBus } from './eventBus.js';

class Router {
    constructor() {
        this.routes = {
            '/': 'index.html',
            '/research': 'research.html',
            '/report': 'report.html',
            '/history': 'history.html'
        };
        this.appRoot = document.getElementById('app-root');
        
        // Listen to browser back/forward buttons
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Intercept all hash clicks globally
        document.body.addEventListener('click', e => {
            if (e.target.matches('[href^="#/"]')) {
                e.preventDefault();
                const path = e.target.getAttribute('href').replace('#', '');
                this.navigateTo(path);
            }
        });
    }

    navigateTo(path) {
        window.history.pushState({}, '', `#${path}`);
        this.handleRoute();
    }

    async handleRoute() {
        let path = window.location.hash.replace('#', '') || '/';
        const htmlFile = this.routes[path];

        if (!htmlFile) {
            console.error(`[Router] Route not found: ${path}`);
            return;
        }

        try {
            // Apply fade out class if components exist
            if (this.appRoot.firstElementChild) {
                this.appRoot.firstElementChild.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 300)); // wait for fade
            }

            // Fetch the HTML shell
            const response = await fetch(htmlFile);
            if (!response.ok) throw new Error('Failed to load view');
            const htmlText = await response.text();

            // Inject the new shell
            this.appRoot.innerHTML = htmlText;

            // Publish route change so UI controllers can bind to the new DOM elements
            eventBus.publish('ROUTE_CHANGED', { path });

        } catch (error) {
            console.error('[Router] Error loading view:', error);
            this.appRoot.innerHTML = `<h2 style="color: var(--error-color); padding: 2rem;">System Error Loading Interface</h2>`;
        }
    }
}

export const router = new Router();
