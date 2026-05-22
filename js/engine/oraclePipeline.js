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
        
        // Subscribing to UI triggers to commence the DAG
        eventBus.subscribe('RESEARCH_INITIATED', () => {
            // Retrieve API keys from browser storage
            const geminiKey = localStorage.getItem('GEMINI_API_KEY') || 'YOUR_GEMINI_KEY';
            const tavilyKey = localStorage.getItem('TAVILY_API_KEY') || 'YOUR_TAVILY_KEY';
            this.executeDeepResearch(geminiKey, tavilyKey);
        });
    }

    async executeDeepResearch(geminiKey, tavilyKey) {
        if (this.isRunning) return;
        this.isRunning = true;
        researchState.update('status', 'RESEARCHING');

        const searchOrchestrator = new TavilySearchOrchestrator(tavilyKey);

        try {
            console.log("[OraclePipeline] Initiating 25-Pass Orchestration DAG...");

            // ==========================================
            // PHASE 1: DISCOVERY & EXTRACTION
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: DISCOVERY', pass: '01-03' });
            await queryGenerator.generatePrimaryBranches(geminiKey);
            
            eventBus.publish('PIPELINE_ACTION', { action: 'Executing Multi-Branch Web Retrieval' });
            // FIX: Execute Tavily Search & Ingest
            const initialResults = await searchOrchestrator.executeInitialPhase();
            sourceManager.ingestSources(initialResults);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '04' });
            await analysisCoordinator.executeGlobalExtraction(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: REFLECTION', pass: '05' });
            await analysisCoordinator.mapContradictions(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: INDEXING', pass: '06' });
            await analysisCoordinator.indexMemory(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: GAP-FILL', pass: '07-08' });
            await queryGenerator.generateSecondaryBranches(geminiKey);
            
            eventBus.publish('PIPELINE_ACTION', { action: 'Executing Secondary Gap-Fill Web Retrieval' });
            // FIX: Execute Gap-Fill Tavily Search & Ingest
            const branchDResults = await searchOrchestrator.executeBranch('branch_D');
            const branchEResults = await searchOrchestrator.executeBranch('branch_E');
            sourceManager.ingestSources([...branchDResults, ...branchEResults]);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: EXTRACTION', pass: '09' });
            await analysisCoordinator.executeSecondaryExtraction(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: COMPRESSION', pass: '10' });
            await analysisCoordinator.compressCorpus(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 1: VERIFICATION', pass: '11' });
            await analysisCoordinator.verifyCorpus(geminiKey);

            // ==========================================
            // PHASE 2: THE COGNITIVE CORE
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: GLOBAL SYNTHESIS', pass: '12' });
            await analysisCoordinator.mergeKnowledgeBase(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: OUTLINING', pass: '13' });
            await researchPlanner.generateMasterOutline(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 2: RED-TEAM CRITIQUE', pass: '14' });
            await researchPlanner.executeRedTeamCritique(geminiKey);

            // ==========================================
            // PHASE 3: GENERATION & ANCHORING
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: GENERATION', pass: '15-21' });
            researchState.update('status', 'SYNTHESIZING');
            await reportAssembler.generateDraftSections(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 3: CITATION RESOLUTION', pass: '22' });
            await reportAssembler.reconstructCitations(geminiKey);

            // ==========================================
            // PHASE 4: POST-PROCESSING
            // ==========================================
            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: SMOOTHING', pass: '23' });
            await reportAssembler.smoothTransitions(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: INTEGRITY AUDIT', pass: '24' });
            await reportAssembler.executeIntegrityAudit(geminiKey);

            eventBus.publish('STAGE_CHANGED', { stage: 'PHASE 4: FINAL AUDIT', pass: '25' });
            await reportAssembler.finalizeReport(geminiKey);

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
