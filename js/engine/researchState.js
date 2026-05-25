/**
 * LexisAI Global State Manager & Desync Preventer
 * Path: /js/engine/researchState.js
 */
import { eventBus } from '../core/eventBus.js';

class ResearchState {
    constructor() {
        this.resetState();
    }

    resetState() {
        // PREVENTS STATE DESYNC: Brutally zero out all memory from previous sessions
        this.query = "";
        this.trajectory = "Initializing deep parallel extraction.";
        
        // Parallel Branching Queries
        this.queries = {
            branch_A: [], // Core Ontology
            branch_B: [], // Contrarian & Edge-Case
            branch_C: [], // Temporal & Statistical
            branch_D: [], // Gap-Fill
            branch_E: []  // Contradiction Deepening
        };

        // Source Memory
        this.rawSources = [];
        this.compressed_corpus = "";
        this.verified_corpus = "";
        this.Compiled_Knowledge_Base = "";
        
        // Epistemological Anchors
        this.anchored_claims = []; // { claim_id, weight, source_url, text }
        this.contradictions = [];  // Immutable CONTRADICTION_OBJECTS
        
        // The Cognitive Core
        this.memory_index = {}; 
        this.visualization_candidates = [];
        this.STYLE_GUIDE = null;
        
        // Generation Drafts
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
        
        this.draft = {
            resolved_citations: "",
            smoothed_and_compressed: ""
        };
        
        this.integrity_audit = "";
        this.snapshots = {};
        this.failures = [];

        this.token_budget = {
            total_allocated: 1000000,
            remaining: 1000000
        };

        console.log("[MEMORY] State brutally zeroed. Ready for new directive.");
    }

    updateField(path, value) {
        const keys = path.split('.');
        let current = this;
        while (keys.length > 1) {
            if (current[keys[0]] === undefined) current[keys[0]] = {};
            current = current[keys.shift()];
        }
        current[keys[0]] = value;
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this)); // Deep clone
    }
}

export const state = new ResearchState();
