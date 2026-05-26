// File Path: js/engine/researchState.js
// Purpose: Centralized state management for the 25-pass Oracle pipeline.
// Syncs continuously with StorageManager and broadcasts updates via EventBus.

import { EventBus } from '../core/eventBus.js';
import { storage } from './storageManager.js';

class ResearchState {
    constructor() {
        this.reset();
    }

    /**
     * Initializes or resets the global state.
     */
    reset() {
        this.data = {
            query: "",
            status: "idle",
            currentPass: 0,
            trajectory: {},
            ontology: {},
            plan: { outline: [] },
            STYLE_GUIDE: "",
            queries: { pass3: [], pass7: [], pass11: [], pass15: [], pass19: [] },
            memory_index: {
                slice1: [], slice2: [], slice3: [], slice4: [], slice5: []
            },
            contradictions: [],
            visualization_candidates: [],
            draft: {
                pass5: "", pass6: "", pass9: "", pass10: "", pass13: "",
                pass14: "", pass17: "", pass18: "", pass21: "", pass22: "",
                all_passes: ""
            },
            audit: { errors: "", ocp_codes: "" },
            final_replacements: {},
            failures: [],
            logs: []
        };
    }

    /**
     * Loads state from IndexedDB. If none exists, starts fresh.
     */
    async initialize() {
        const savedState = await storage.loadState();
        if (savedState) {
            this.data = savedState;
            console.log("[ResearchState] Recovered state from memory.");
            EventBus.emit('STATE_RECOVERED', this.data);
        }
    }

    /**
     * Deep updates the state, saves to IndexedDB, and emits telemetry.
     * @param {string} path - Object path (e.g., 'draft.pass5')
     * @param {any} value - The data to inject
     */
    async update(path, value) {
        const keys = path.split('.');
        let current = this.data;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        // Log telemetry
        this.data.logs.push(`[Pass ${this.data.currentPass}] Updated ${path}`);
        
        // Persist and Notify
        await storage.saveState(this.data);
        EventBus.emit('STATE_UPDATED', { path, value, pass: this.data.currentPass });
    }

    get(path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], this.data);
    }
}

export const stateManager = new ResearchState();
