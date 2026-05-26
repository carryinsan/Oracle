// File Path: js/core/config.js
// Purpose: Central configuration, API key rotation, token budgets, and DAG pass definitions.

export const Config = {
    APP_NAME: "LexisAI",
    VERSION: "14.0.0-Algorithmic-Final",
    
    // API Endpoints (Stateless proxies on Vercel)
    ENDPOINTS: {
        GEMINI: '/api/gemini',
        TAVILY: '/api/tavily'
    },

    // Token & Memory Budgets
    MEMORY: {
        MAX_CONTEXT_TOKENS: 600000, // Gemini 2.5 Flash upper safe limit
        TARGET_SUMMARY_TOKENS: 2000,
        COMPRESSION_THRESHOLD: 150000
    },

    // UI & Animation Constants
    UI: {
        STREAM_SPEED_MS: 15,
        ANIMATION_DURATION_MS: 400,
        PROGRESS_UPDATE_INTERVAL_MS: 100
    },

    // 25-Pass Directed Acyclic Graph (DAG) Pipeline Definition
    // Strictly interleaved as requested in the oracle docs.
    PIPELINE_STAGES: [
        { pass: 1, type: "THINK", name: "Initial Cognitive Framing" },
        { pass: 2, type: "PLAN", name: "Strategic Research Plan Generation" },
        { pass: 3, type: "SEARCH", name: "Primary Knowledge Retrieval", depth: "advanced", maxResults: 20 },
        { pass: 4, type: "THINK", name: "Source Analysis & Contradiction Check" },
        { pass: 5, type: "WRITE", name: "Executive Synthesis Draft" },
        { pass: 6, type: "WRITE", name: "Foundational Context Drafting" },
        { pass: 7, type: "SEARCH", name: "Secondary Knowledge Retrieval", depth: "advanced", maxResults: 20 },
        { pass: 8, type: "THINK", name: "Evidence Evaluation" },
        { pass: 9, type: "WRITE", name: "Core Analytical Argumentation" },
        { pass: 10, type: "WRITE", name: "Data Integration & Structuring" },
        { pass: 11, type: "SEARCH", name: "Tertiary Knowledge Retrieval", depth: "advanced", maxResults: 20 },
        { pass: 12, type: "THINK", name: "Gap Analysis & Epistemic Verification" },
        { pass: 13, type: "WRITE", name: "Sub-Topic Expansion A" },
        { pass: 14, type: "WRITE", name: "Sub-Topic Expansion B" },
        { pass: 15, type: "SEARCH", name: "Final Verification Retrieval", depth: "advanced", maxResults: 20 },
        { pass: 16, type: "THINK", name: "Final Synthesis & Alignment" },
        { pass: 17, type: "WRITE", name: "Conclusion Assembly" },
        { pass: 18, type: "WRITE", name: "Future Outlook Drafting" },
        { pass: 19, type: "SEARCH", name: "Citation & Reference Verification", depth: "advanced", maxResults: 20 },
        { pass: 20, type: "THINK", name: "Risk & Bias Analysis" },
        { pass: 21, type: "WRITE", name: "Executive Summary Refinement" },
        { pass: 22, type: "WRITE", name: "Final Document Compilation" },
        // The OCP (Oracle Code Pass) Algorithmic Block
        { pass: 23, type: "AUDIT", name: "Tone & Error Detection" },
        { pass: 24, type: "CODE_GEN", name: "Algorithmic OCP Mapping" },
        { pass: 25, type: "SOLVE", name: "Direct String Replacement & Finalization" }
    ],

    // Client-side Key Rotation Helper (Used if keys are passed locally or mapped through backend)
    getKeys: () => {
        return {
            gemini: [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_A,
                process.env.GEMINI_API_KEY_B1,
                process.env.GEMINI_API_KEY_B2,
                process.env.GEMINI_API_KEY_B3,
                process.env.GEMINI_API_KEY_B4,
                process.env.GEMINI_API_KEY_C
            ].filter(Boolean),
            groq: process.env.GROQ_API_KEY,
            openrouter: process.env.OPENROUTER_API_KEY,
            tavily: process.env.TAVILY_API_KEY
        };
    }
};
