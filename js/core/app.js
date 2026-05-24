// js/core/app.js
import { router } from './router.js';
import { oraclePipeline } from '../engine/oraclePipeline.js';
import { researchState } from '../engine/researchState.js';
import { eventBus } from './eventBus.js';

// Wake Up Commands for UI Controllers
import '../ui/researchTimeline.js';
import '../ui/researchProgress.js';
import '../ui/researchFeed.js';
import '../ui/reportViewer.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize the SPA Router
    router.init();

    const searchInput = document.querySelector('input[type="text"]') || document.querySelector('input');

    const triggerPipeline = (e) => {
        if (e) e.preventDefault(); // Annihilates the native reload bug

        const query = searchInput ? searchInput.value.trim() : "";
        if (!query) return;

        // 2. Lock the query into the central state
        researchState.update('user_prompt', query);

        // 3. Seamlessly transition the UI to the Research Screen
        window.location.hash = '/research';

        // 4. Boot up the DAG Engine after a brief UI transition buffer
        setTimeout(() => {
            eventBus.publish('RESEARCH_INITIATED', { query });
        }, 300);
    };

    // THE FIX: Globally intercept ANY form submissions to prevent the "?" URL reload
    document.addEventListener('submit', (e) => {
        e.preventDefault();
        triggerPipeline(e);
    });

    // THE FIX: Bind the "Enter" key explicitly
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerPipeline(e);
            }
        });
    }

    // THE FIX: Bind the new Send SVG Icon click globally
    document.addEventListener('click', (e) => {
        // Checks if the user clicked the new Send SVG (or a path inside it)
        if (e.target.closest('svg') || e.target.id === 'btn-send' || e.target.closest('.send-btn')) {
            e.preventDefault();
            triggerPipeline(e);
        }
    });
});
