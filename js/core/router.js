// js/core/router.js
import { eventBus } from './eventBus.js';

export const router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        setTimeout(() => this.handleRoute(), 50);
    },

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const homeContent = document.getElementById('home-content');
        
        const dynamicViews = document.querySelectorAll('.dynamic-view');
        dynamicViews.forEach(view => view.style.display = 'none');

        if (hash === '#/' || hash === '') {
            if (homeContent) homeContent.style.display = 'grid';
        } 
        else if (hash === '#/research') {
            if (homeContent) homeContent.style.display = 'none';
            await this.loadView('./research.html');
            // The critical broadcast: The HTML is now in the DOM!
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
                window.location.hash = '#/';
                return;
            }
        }
        
        viewContainer.style.display = 'block';
    }
};
