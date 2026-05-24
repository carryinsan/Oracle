//js/core/app.js
import { router } from './router.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from './eventBus.js';

// Wake up the Engine
import '../engine/oraclePipeline.js';

// Wake Up Commands for UI Controllers
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/researchFeed.js';
import '../ui/reportViewer.js';

// MODIFIED: Injected the missing opening curly brace '{' to validate the arrow function
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize SPA Router
        router.init();

        const searchInput = document.getElementById('search-input') || 
            document.querySelector('input');

        let pendingResearchQuery = null;

        const triggerPipeline = () => {
            const query = searchInput ? searchInput.value.trim() : "";
            if (!query) return; // Ignores empty clicks
            
            // Lock query into central state
            researchState.update('user_prompt', query);

            // THE FIX: The "Same-Hash" Trap Bypass
            if (window.location.hash === '#/research') {
                // If we are ALREADY on the research page, don't wait for the router. Fire instantly!
                eventBus.publish('RESEARCH_INITIATED', { query });
                
                // Clear the logs/timeline if they were filled from a previous run
                const logContainer = document.getElementById('live-log-container');
                if (logContainer) logContainer.innerHTML = "";
            } else {
                // If we are on the Home page, set the lock and transition smoothly
                pendingResearchQuery = query;
                window.location.hash = '#/research';
            }
        };

        // The Synchronized Starting Gun (For Home Page Transitions)
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research' && pendingResearchQuery) {
                const queryToRun = pendingResearchQuery;
                pendingResearchQuery = null;
                setTimeout(() => {
                    eventBus.publish('RESEARCH_INITIATED', { query: queryToRun });
                }, 50);
            }
        });

        // The Ultimate Interceptor
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            triggerPipeline();
        });

        // Catch the Enter Key
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerPipeline();
                }
            });
        }

        // Catch the SVG / Button Click safely
        document.addEventListener('click', (e) => {
            const target = e.target instanceof Element ? e.target : e.target.parentElement;
            if (!target) return;
            
            if (target.closest('svg') || target.id === 'btn-send' || target.closest('.send-btn')) {
                e.preventDefault();
                triggerPipeline();
            }
        });

    } catch (error) {
        console.error("[FATAL ERROR] App failed to load:", error);
    }
});
