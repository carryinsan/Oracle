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
    // 1. Silent URL Cleaner (Stops the '?' bug)
    if (window.location.href.includes('?')) {
        const cleanUrl = window.location.href.replace(/\?/g, '');
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // 2. Boot the Router
    router.init();

    // 3. Centralized Launch Sequence
    const triggerPipeline = (queryText) => {
        if (!queryText) return;
        
        // Lock query into memory
        researchState.update('user_prompt', queryText);
        
        // Force the URL route change
        window.location.hash = '/research';
        
        // Brief delay to allow the HTML to render, then fire the engine
        setTimeout(() => {
            eventBus.publish('RESEARCH_INITIATED', { query: queryText });
        }, 300);
    };

    // THE FIX: Global Form Lockdown
    document.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') || document.querySelector('input');
        if (input) triggerPipeline(input.value.trim());
    });

    // THE FIX: Global "Enter" Key Catcher
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            triggerPipeline(e.target.value.trim());
        }
    });

    // THE FIX: Global SVG / Button Catcher
    document.addEventListener('click', (e) => {
        // Did the user click the send button, the SVG icon, or a path inside the SVG?
        const isSendClick = e.target.closest('#btn-send') || e.target.closest('svg.send-btn') || e.target.closest('svg');
        
        if (isSendClick) {
            e.preventDefault();
            const input = document.querySelector('input[type="text"]') || document.querySelector('input');
            if (input) triggerPipeline(input.value.trim());
        }
    });
});
