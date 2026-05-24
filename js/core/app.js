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
    // 1. SILENT URL CLEANER (The Ultimate "?" Killer)
    // If a wild '?' ever sneaks into the URL, this mathematically erases it 
    // without reloading the page, saving the SPA router from breaking.
    if (window.location.href.includes('?')) {
        const cleanUrl = window.location.href.replace(/\?/g, '');
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // 2. Initialize the SPA Router
    router.init();

    const searchInput = document.querySelector('input[type="text"]') || document.querySelector('input');

    const triggerPipeline = (e) => {
        if (e) {
            e.preventDefault(); 
            e.stopPropagation(); // Stops the event from bubbling up to any sneaky forms
        }

        const query = searchInput ? searchInput.value.trim() : "";
        if (!query) return;

        // Lock the query into the central state
        researchState.update('user_prompt', query);

        // Seamlessly transition the UI
        window.location.hash = '/research';

        // Boot up the DAG Engine
        setTimeout(() => {
            eventBus.publish('RESEARCH_INITIATED', { query });
        }, 300);
    };

    // 3. TARGETED FORM LOCKDOWN
    // Instead of relying on the global document, we explicitly paralyze the form tag itself.
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            triggerPipeline(e);
        });
    });

    // 4. Bind the "Enter" key explicitly
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerPipeline(e);
            }
        });
    }

    // 5. Bind the SVG Icon click globally
    document.addEventListener('click', (e) => {
        if (e.target.closest('svg') || e.target.id === 'btn-send' || e.target.closest('.send-btn')) {
            e.preventDefault();
            triggerPipeline(e);
        }
    });
});
