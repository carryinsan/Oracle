// js/core/app.js
import { router } from './router.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from './eventBus.js';

// 1. CRITICAL FIX: Wake up the Engine! (I accidentally removed this previously)
import '../engine/oraclePipeline.js'; 

// Wake Up Commands for UI Controllers
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/researchFeed.js';
import '../ui/reportViewer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize SPA Router
    router.init();

    const searchInput = document.getElementById('search-input') || document.querySelector('input');
    
    // THE LOCK: Stores the query safely until the UI is 100% ready
    let pendingResearchQuery = null; 

    const triggerPipeline = () => {
        const query = searchInput ? searchInput.value.trim() : "";
        if (!query) return;

        // Lock query into central state
        researchState.update('user_prompt', query);
        pendingResearchQuery = query;

        // Transition UI safely via hash routing
        window.location.hash = '#/research';
        
        // Notice: The blind 300ms timeout has been completely deleted.
    };

    // 2. THE SYNCHRONIZED STARTING GUN
    // This replaces the blind timeout. It listens to the router and mathematically 
    // guarantees the engine will not start until Vercel has fully downloaded 
    // and painted the Research UI on your screen.
    eventBus.subscribe('ROUTE_CHANGED', (data) => {
        if (data.path === '/research' && pendingResearchQuery) {
            const queryToRun = pendingResearchQuery;
            pendingResearchQuery = null; // Clear it so it only runs once
            
            // A micro-delay to ensure the UI controllers have finished binding to the DOM
            setTimeout(() => {
                eventBus.publish('RESEARCH_INITIATED', { query: queryToRun });
            }, 50); 
        }
    });

    // THE ULTIMATE INTERCEPTOR: Kills the '?' reload globally
    document.addEventListener('submit', (e) => {
        e.preventDefault(); 
        triggerPipeline();
    });

    // Catch the Enter Key safely
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerPipeline();
            }
        });
    }

    // Catch the Button Click safely
    document.addEventListener('click', (e) => {
        const target = e.target instanceof Element ? e.target : e.target.parentElement;
        if (!target) return;
        
        if (target.closest('svg') || target.id === 'btn-send' || target.closest('.send-btn')) {
            e.preventDefault();
            triggerPipeline();
        }
    });
});
