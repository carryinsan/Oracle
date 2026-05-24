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
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        // Trigger route check immediately on load
        this.handleRoute(); 
    }

    async handleRoute() {
        let path = window.location.hash.replace('#', '') || '/';
        
        // If we are on the home screen, clear the dynamic app container
        if (path === '/') {
            const appDiv = document.getElementById('app');
            if (appDiv) appDiv.innerHTML = ''; 
            return;
        }

        const file = this.routes[path];
        if (!file) return;

        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`404: ${file} not found`);
            const html = await response.text();
            
            // THE FIX: The Safe Mount. If <div id="app"> is missing from index.html, build it.
            let appContainer = document.getElementById('app');
            if (!appContainer) {
                appContainer = document.createElement('div');
                appContainer.id = 'app';
                document.body.appendChild(appContainer);
            }
            
            appContainer.innerHTML = html;
            
            // Notify UI controllers to bind to the newly injected HTML
            eventBus.publish('ROUTE_CHANGED', { path });

        } catch (error) {
            console.error('[Router] Fatal Routing Error:', error);
        }
    }

    navigateTo(path) {
        window.location.hash = path;
    }
}

export const router = new Router();
