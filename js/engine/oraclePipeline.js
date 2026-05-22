// js/engine/oraclePipeline.js
import { eventBus } from '../core/eventBus.js';
import { researchState } from './researchState.js';
import { queryGenerator } from './queryGenerator.js';
import { analysisCoordinator } from './analysisCoordinator.js';
import { researchPlanner } from './researchPlanner.js';
import { reportAssembler } from './reportAssembler.js';

export class OraclePipeline {
    constructor() {
        this.isRunning = false;
    }

    async executeDeepResearch(apiKey) {
        if (this.isRunning) return;
        this.isRunning = true;
        researchState.update('status', 'RESEARCHING');

        try {
            console.log("[OraclePipeline] Initiating 25-Pass Orchestration DAG...");

            // ==========================================
            // PHASE 1: PARALLEL DISCOVERY & EXTRACTION
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: DISCOVERY', pass: '01-03' });
            
            // Passes 01, 02, 03: Parallel Query Generation
            await queryGenerator.generatePrimaryBranches(apiKey);
            
            // Execute Web Search (Tavily Integration from Part 4)
            eventBus.publish('PIPELINE_ACTION', { action: 'Executing Multi-Branch Web Retrieval' });
            // await tavilySearchOrchestrator.executeInitialPhase(); -> assumed executed here

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '04' });
            // Pass 04: Global Extraction & ID Anchoring
            await analysisCoordinator.executeGlobalExtraction(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: REFLECTION', pass: '05' });
            // Pass 05: Immutable Contradiction Mapping
            await analysisCoordinator.mapContradictions(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: INDEXING', pass: '06' });
            // Pass 06: Memory Indexing & Thematic Clustering
            await analysisCoordinator.indexMemory(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: GAP-FILL', pass: '07-08' });
            // Passes 07, 08: Gap-Fill Search Generation
            await queryGenerator.generateSecondaryBranches(apiKey);
            // await tavilySearchOrchestrator.executeSecondaryPhase(); -> assumed executed

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '09' });
            // Pass 09: Secondary Extraction
            await analysisCoordinator.executeSecondaryExtraction(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: COMPRESSION', pass: '10' });
            // Pass 10: Token Control & Triage
            await analysisCoordinator.compressCorpus(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: VERIFICATION', pass: '11' });
            // Pass 11: Fact Consistency & Snapshot
            await analysisCoordinator.verifyCorpus(apiKey);


            // ==========================================
            // PHASE 2: THE COGNITIVE CORE
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: GLOBAL SYNTHESIS', pass: '12' });
            // Pass 12: Global Synthesis (The Merge)
            await analysisCoordinator.mergeKnowledgeBase(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: OUTLINING', pass: '13' });
            // Pass 13: Master Outlining & Style Generation
            await researchPlanner.generateMasterOutline(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: RED-TEAM CRITIQUE', pass: '14' });
            // Pass 14: Red-Team Critique
            await researchPlanner.executeRedTeamCritique(apiKey);


            // ==========================================
            // PHASE 3: PARALLEL GENERATION & ANCHORING
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: GENERATION', pass: '15-21' });
            researchState.update('status', 'SYNTHESIZING');
            
            // Passes 15-21: Parallel Block Generation
            await reportAssembler.generateDraftSections(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: CITATION RESOLUTION', pass: '22' });
            // Pass 22: Citation Reconstruction
            await reportAssembler.reconstructCitations(apiKey);


            // ==========================================
            // PHASE 4: POST-PROCESSING & ALIGNMENT
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: SMOOTHING', pass: '23' });
            // Pass 23: Transitional Smoothing
            await reportAssembler.smoothTransitions(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: INTEGRITY AUDIT', pass: '24' });
            // Pass 24: Cognitive Integrity Audit
            await reportAssembler.executeIntegrityAudit(apiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: FINAL AUDIT', pass: '25' });
            // Pass 25: Final Core Audit & Humanize
            await reportAssembler.finalizeReport(apiKey);

            // ==========================================
            // PIPELINE COMPLETE
            // ==========================================
            researchState.update('status', 'COMPLETED');
            eventBus.publish('PIPELINE_COMPLETE', { success: true });
            console.log("[OraclePipeline] 25-Pass Orchestration Successfully Concluded.");

        } catch (error) {
            console.error("[OraclePipeline] Fatal DAG Interruption:", error);
            researchState.update('status', 'ERROR');
            researchState.failures.push(error.message);
            eventBus.publish('PIPELINE_ERROR', { error: error.message });
        } finally {
            this.isRunning = false;
        }
    }
}

export const oraclePipeline = new OraclePipeline();
