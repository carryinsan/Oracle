// js/engine/oraclePipeline.js
import { eventBus } from '../core/eventBus.js';
import { researchState } from './researchState.js';
import { queryGenerator } from './queryGenerator.js';
import { analysisCoordinator } from './analysisCoordinator.js';
import { researchPlanner } from './researchPlanner.js';
import { reportAssembler } from './reportAssembler.js';
import { TavilySearchOrchestrator } from '../api/tavilySearch.js';
import { sourceManager } from './sourceManager.js';

export class OraclePipeline {
    constructor() {
        this.isRunning = false;
        
        eventBus.subscribe('RESEARCH_INITIATED', () => {
            // Null parameters; keys are now handled by the backend
            this.executeDeepResearch(null, null);
        });
    }

    async executeDeepResearch(dummyGemini, dummyTavily) {
        if (this.isRunning) return;
        this.isRunning = true;
        researchState.update('status', 'RESEARCHING');

        const searchOrchestrator = new TavilySearchOrchestrator(dummyTavily);

        try {
            console.log("[OraclePipeline] Initiating 25-Pass Orchestration DAG...");

            // ==========================================
            // PHASE 1: DISCOVERY & EXTRACTION
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: DISCOVERY', pass: '01-03' });
            await queryGenerator.generatePrimaryBranches(dummyGemini);
            
            eventBus.publish('PIPELINE_ACTION', { action: 'Executing Multi-Branch Web Retrieval' });
            const initialResults = await searchOrchestrator.executeInitialPhase();
            sourceManager.ingestSources(initialResults);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '04' });
            await analysisCoordinator.executeGlobalExtraction(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: REFLECTION', pass: '05' });
            await analysisCoordinator.mapContradictions(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: INDEXING', pass: '06' });
            await analysisCoordinator.indexMemory(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: GAP-FILL', pass: '07-08' });
            await queryGenerator.generateSecondaryBranches(dummyGemini);
            
            eventBus.publish('PIPELINE_ACTION', { action: 'Executing Secondary Gap-Fill Web Retrieval' });
            const branchDResults = await searchOrchestrator.executeBranch('branch_D');
            const branchEResults = await searchOrchestrator.executeBranch('branch_E');
            sourceManager.ingestSources([...branchDResults, ...branchEResults]);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '09' });
            await analysisCoordinator.executeSecondaryExtraction(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: COMPRESSION', pass: '10' });
            await analysisCoordinator.compressCorpus(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: VERIFICATION', pass: '11' });
            await analysisCoordinator.verifyCorpus(dummyGemini);

            // ==========================================
            // PHASE 2: THE COGNITIVE CORE
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: GLOBAL SYNTHESIS', pass: '12' });
            await analysisCoordinator.mergeKnowledgeBase(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: OUTLINING', pass: '13' });
            await researchPlanner.generateMasterOutline(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: RED-TEAM CRITIQUE', pass: '14' });
            await researchPlanner.executeRedTeamCritique(dummyGemini);

            // ==========================================
            // PHASE 3: GENERATION & ANCHORING
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: GENERATION', pass: '15-21' });
            researchState.update('status', 'SYNTHESIZING');
            await reportAssembler.generateDraftSections(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: CITATION RESOLUTION', pass: '22' });
            await reportAssembler.reconstructCitations(dummyGemini);

            // ==========================================
            // PHASE 4: POST-PROCESSING
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: SMOOTHING', pass: '23' });
            await reportAssembler.smoothTransitions(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: INTEGRITY AUDIT', pass: '24' });
            await reportAssembler.executeIntegrityAudit(dummyGemini);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: FINAL AUDIT', pass: '25' });
            await reportAssembler.finalizeReport(dummyGemini);

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
