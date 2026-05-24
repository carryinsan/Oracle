// js/core/app.js
import { router } from './router.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from './eventBus.js';

// Wake Up Commands for UI Controllers
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/researchFeed.js';
import '../ui/reportViewer.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize SPA Router
    router.init();

    const searchInput = document.getElementById('search-input') || document.querySelector('input');

    const triggerPipeline = () => {
        const query = searchInput ? searchInput.value.trim() : "";
        if (!query) return;

        // Lock query into central state
        researchState.update('user_prompt', query);

        // Transition UI safely via hash routing
        window.location.hash = '#/research';

        // Boot up DAG Engine
        setTimeout(() => {
            eventBus.publish('RESEARCH_INITIATED', { query });
        }, 300);
    };

    // 2. THE ULTIMATE INTERCEPTOR: Kills the '?' reload globally
    document.addEventListener('submit', (e) => {
        e.preventDefault(); 
        triggerPipeline();
    });

    // 3. Catch the Enter Key safely
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerPipeline();
            }
        });
    }

    // 4. Catch the Button Click safely
    document.addEventListener('click', (e) => {
        const target = e.target instanceof Element ? e.target : e.target.parentElement;
        if (!target) return;
        
        if (target.closest('svg') || target.id === 'btn-send' || target.closest('.send-btn')) {
            e.preventDefault();
            triggerPipeline();
        }
    });
});
