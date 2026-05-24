// js/core/router.js
import { eventBus } from './eventBus.js';

export const router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Small 50ms buffer to ensure DOM paints properly before checking URL
        setTimeout(() => this.handleRoute(), 50);
    },

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const homeContent = document.getElementById('home-content');
        
        // 1. Instantly hide all injected dynamic views to prevent overlap
        const dynamicViews = document.querySelectorAll('.dynamic-view');
        dynamicViews.forEach(view => view.style.display = 'none');

        // 2. Safe Toggle Logic (No innerHTML destruction)
        if (hash === '#/' || hash === '') {
            if (homeContent) homeContent.style.display = 'grid';
        } 
        else if (hash === '#/research') {
            if (homeContent) homeContent.style.display = 'none';
            await this.loadView('./research.html');
            eventBus.publish('ROUTE_CHANGED', { path: '/research' });
        } 
        else if (hash === '#/report') {
            if (homeContent) homeContent.style.display = 'none';
            await this.loadView('./report.html');
            eventBus.publish('ROUTE_CHANGED', { path: '/report' });
        } 
        else if (hash === '#/history') {
            if (homeContent) homeContent.style.display = 'none';
            await this.loadView('./history.html');
            eventBus.publish('ROUTE_CHANGED', { path: '/history' });
        }
    },

    async loadView(url) {
        const viewId = 'view-' + url.replace('./', '').replace('.html', '');
        let viewContainer = document.getElementById(viewId);

        // If we haven't fetched this specific page yet, fetch and inject it safely
        if (!viewContainer) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                const html = await response.text();
                
                viewContainer = document.createElement('div');
                viewContainer.id = viewId;
                viewContainer.className = 'dynamic-view';
                viewContainer.innerHTML = html;
                
                const appDiv = document.getElementById('app');
                if (appDiv) appDiv.appendChild(viewContainer);
            } catch (error) {
                console.error('[Router Error]:', error);
                // Fail-safe: Auto-recover to the home screen if fetch crashes
                window.location.hash = '#/';
                return;
            }
        }
        
        // Make the requested view visible
        viewContainer.style.display = 'block';
    }
};
