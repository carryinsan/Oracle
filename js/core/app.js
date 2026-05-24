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
    try {
        // 1. SILENT URL CLEANER (The Ultimate "?" Killer)
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
                if (typeof e.stopPropagation === 'function') e.stopPropagation();
            }

            const query = searchInput ? searchInput.value.trim() : "";
            if (!query) return;

            researchState.update('user_prompt', query);
            window.location.hash = '/research';

            setTimeout(() => {
                eventBus.publish('RESEARCH_INITIATED', { query });
            }, 300);
        };

        // 3. TARGETED FORM LOCKDOWN
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

        // 5. THE TYPE-SAFE CLICK SHIELD
        document.addEventListener('click', (e) => {
            // Guarantee we are interacting with an HTML Element, not a text node
            const target = e.target instanceof Element ? e.target : e.target.parentElement;
            if (!target) return;
            
            if (target.closest('svg') || target.id === 'btn-send' || target.closest('.send-btn')) {
                e.preventDefault();
                triggerPipeline(e);
            }
        });

    } catch (error) {
        console.error("[App Initialization Fatal Error]:", error);
    }
});
