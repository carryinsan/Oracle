// js/core/app.js
import { router } from './router.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from './eventBus.js';

// CRITICAL: Wake up the Cognitive Engine
import '../engine/oraclePipeline.js'; 

// CRITICAL: Wake up all UI Controllers
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/researchFeed.js';
import '../ui/reportViewer.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. SILENT URL CLEANER (The Ultimate "?" Killer)
        if (window.location.href.includes('?')) {
            const cleanUrl = window.location.href.replace(/\?/g, '');
            window.history.replaceState({}, document.title, cleanUrl);
        }

        // 2. Initialize SPA Router
        router.init();

        // 3. The Lock: Stores the query safely until the UI is 100% ready
        let pendingResearchQuery = null; 

        // 4. The Master Trigger Function
        const triggerPipeline = () => {
            // Zero-Trust: Hunt for the input field at the exact moment of execution
            const searchInput = document.getElementById('search-input') || document.querySelector('input');
            const query = searchInput ? searchInput.value.trim() : "";
            
            if (!query) return; // Ignore empty clicks silently

            // Lock query into central state
            researchState.update('user_prompt', query);

            // THE "SAME-HASH" BYPASS
            if (window.location.hash === '#/research') {
                // We are already on the research page. Do not wait for the router.
                // Clear old logs for a fresh run, then fire the engine instantly.
                const logContainer = document.getElementById('live-log-container');
                if (logContainer) logContainer.innerHTML = '';
                
                eventBus.publish('RESEARCH_INITIATED', { query });
            } else {
                // We are on the Home page. Arm the lock and change the URL.
                pendingResearchQuery = query;
                window.location.hash = '#/research';
            }
        };

        // 5. THE SYNCHRONIZED STARTING GUN
        // Listens to the router. Ensures the engine NEVER starts until the UI is fully painted.
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research' && pendingResearchQuery) {
                const queryToRun = pendingResearchQuery;
                pendingResearchQuery = null; // Clear the lock
                
                // Micro-delay to ensure UI bindings are 100% complete
                setTimeout(() => {
                    eventBus.publish('RESEARCH_INITIATED', { query: queryToRun });
                }, 50); 
            }
        });

        // 6. UNIVERSAL EVENT DELEGATION (Immune to missing elements)
        
        // Block all native forms globally
        document.addEventListener('submit', (e) => {
            e.preventDefault(); 
            triggerPipeline();
        });

        // Listen for "Enter" key universally
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const target = e.target;
                // Only trigger if they pressed enter inside an input field
                if (target && target.tagName && target.tagName.toLowerCase() === 'input') {
                    e.preventDefault();
                    triggerPipeline();
                }
            }
        });

        // Listen for clicks on the Send button/SVG universally
        document.addEventListener('click', (e) => {
            const target = e.target instanceof Element ? e.target : e.target.parentElement;
            if (!target) return;
            
            // Check if they clicked the button, the SVG, or a path inside the SVG
            if (target.closest('#btn-send') || target.closest('.send-btn') || target.id === 'btn-send') {
                e.preventDefault();
                triggerPipeline();
            }
        });

    } catch (error) {
        console.error("[FATAL ERROR] App.js failed to initialize:", error);
    }
});
