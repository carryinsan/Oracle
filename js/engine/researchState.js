// js/engine/researchState.js

class ResearchState {
    constructor() {
        this.reset();
    }

    reset() {
        this.sessionId = crypto.randomUUID();
        this.status = "IDLE"; // IDLE, RESEARCHING, SYNTHESIZING, COMPLETED, ERROR
        
        // Pass 1-11: Discovery & Extraction
        this.user_prompt = "";
        this.trajectory = [];
        this.queries = {
            branch_A: [], // Ontology
            branch_B: [], // Contrarian
            branch_C: [], // Temporal
            branch_D: [], // Gap-Fill 1
            branch_E: []  // Gap-Fill 2
        };
        
        // Epistemological Core
        this.raw = [];
        this.anchored_claims = []; // Array of objects with claim_id, weight, source, text
        this.contradictions = [];  // CONTRADICTION_OBJECTS
        this.memory_index = {};    // SEMANTIC MEMORY INDEX
        this.visualization_candidates = [];
        this.compressed_corpus = "";
        this.verified_corpus = "";
        
        // Snapshots for Failsafe Recovery
        this.snapshots = {
            phase1: null,
            pre_write: null
        };

        // Pass 12-14: Cognitive Core
        this.Compiled_Knowledge_Base = "";
        this.sections = {
            outline: "",
            outline_optimized: "",
            introduction: "",
            core_mechanics: "",
            deep_dive_a: "",
            deep_dive_b: "",
            data_metrics: "",
            nuance_and_temporal: "",
            conclusion: ""
        };
        this.STYLE_GUIDE = "";

        // Pass 22-25: Post-Processing
        this.draft = {
            resolved_citations: "",
            smoothed_and_compressed: ""
        };
        this.integrity_audit = [];
        
        // Token Tracking
        this.token_budget = {
            used: 0,
            remaining: 0
        };
        
        // Global Error State
        this.failures = [];
    }

    update(keyPath, value) {
        const keys = keyPath.split('.');
        let current = this;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    }

    get(keyPath) {
        return keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : null, this);
    }
}

export const researchState = new ResearchState();
