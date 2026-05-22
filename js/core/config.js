// js/core/config.js

export const CONFIG = {
    APP_NAME: "LexisAI",
    VERSION: "13.0",
    
    // Orchestration Parameters
    ORCHESTRATION: {
        TOTAL_PASSES: 25,
        MAX_SEARCH_QUERIES: 15,
        MAX_RETRIES: 3,
        TIMEOUT_MS: 30000
    },

    // Token Governance
    TOKEN_BUDGET: {
        MAX_CONTEXT_WINDOW: 1000000, // Gemini 1.5/2.5 Flash max window
        SAFETY_MARGIN: 5000,
        COMPRESSION_THRESHOLD: 800000
    },

    // UI & Storage Parameters
    UI: {
        STREAMING_CHUNK_DELAY_MS: 15,
        ANIMATION_DURATION_MS: 600
    },
    
    STORAGE: {
        INDEXED_DB_NAME: "LexisAI_Memory",
        INDEXED_DB_VERSION: 1
    }
};
