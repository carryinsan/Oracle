// js/core/app.js
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

document.addEventListener('DOMContentLoaded', () => {
  try {
    router.init();

    const searchInput =
      document.getElementById('search-input') || document.querySelector('input');

    let pendingResearchQuery = null;

    const triggerPipeline = () => {
      const query = searchInput ? searchInput.value.trim() : '';
      if (!query) return;

      researchState.update('user_prompt', query);

      // If already on the research page, fire immediately.
      if (window.location.hash === '#/research') {
        eventBus.publish('RESEARCH_INITIATED', { query });

        const logContainer = document.getElementById('live-log-container');
        if (logContainer) logContainer.innerHTML = '';
        return;
      }

      // Otherwise route first, then start the pipeline.
      pendingResearchQuery = query;
      window.location.hash = '#/research';
    };

    eventBus.subscribe('ROUTE_CHANGED', (data) => {
      if (data.path === '/research' && pendingResearchQuery) {
        const queryToRun = pendingResearchQuery;
        pendingResearchQuery = null;

        setTimeout(() => {
          eventBus.publish('RESEARCH_INITIATED', { query: queryToRun });
        }, 50);
      }
    });

    document.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerPipeline();
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerPipeline();
        }
      });
    }

    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!target) return;

      if (target.closest('svg') || target.id === 'btn-send' || target.closest('.send-btn')) {
        e.preventDefault();
        triggerPipeline();
      }
    });
  } catch (error) {
    console.error('[FATAL ERROR] App failed to load:', error);
  }
});
