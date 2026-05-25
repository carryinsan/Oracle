/**
 * LexisAI Core Configuration & Heuristics
 * Path: /js/core/config.js
 */

export const CONFIG = {
    // Pipeline Strict Limits
    MAX_AI_PASSES: 25,
    MAX_TAVILY_PASSES: 15,
    
    // UI Timings
    ANIMATION_SPEED_MS: 300,
    
    // Single Page Application Route Map
    ROUTES: {
        '': 'index.html',
        '#/': 'index.html',
        '#/research': 'research.html',
        '#/report': 'report.html',
        '#/history': 'history.html',
        '#/export': 'export.html'
    }
};
