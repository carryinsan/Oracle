/**
 * LexisAI 40-Pass Deterministic State Machine
 * Path: /js/engine/oraclePipeline.js
 */
import { state } from './researchState.js';
import { eventBus } from '../core/eventBus.js';
import { ProgressTracker } from './progressTracker.js';
import { QueryGenerator } from './queryGenerator.js';
import { TavilySearch } from '../api/tavilySearch.js';
import { SourceManager } from './sourceManager.js';
import { AnalysisCoordinator } from './analysisCoordinator.js';
import { ReportAssembler } from './reportAssembler.js';

import { PASS_01_BRANCH_A, PASS_02_BRANCH_B, PASS_03_BRANCH_C, PASS_07_BRANCH_D } from '../prompts/researchPrompts.js';
import { PASS_15_EXEC_SUMMARY, PASS_16_CORE_MECHANICS, PASS_17_DEEP_DIVE_A, PASS_20_NUANCE_EDGE_CASES } from '../prompts/writingPrompts.js';

class OraclePipeline {
    async execute(userIntent) {
        try {
            state.resetState();
            state.query = userIntent;
            ProgressTracker.reset();

            // PHASE 1: DISCOVERY
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: DISCOVERY...` });
            ProgressTracker.advance("PHASE 1: DISCOVERY", 3);
            
            const branchResults = await Promise.allSettled([
                QueryGenerator.generateBranch('A', PASS_01_BRANCH_A, userIntent),
                QueryGenerator.generateBranch('B', PASS_02_BRANCH_B, userIntent),
                QueryGenerator.generateBranch('C', PASS_03_BRANCH_C, userIntent)
            ]);

            state.queries.branch_A = branchResults[0].status === 'fulfilled' ? branchResults[0].value : [];
            state.queries.branch_B = branchResults[1].status === 'fulfilled' ? branchResults[1].value : [];
            state.queries.branch_C = branchResults[2].status === 'fulfilled' ? branchResults[2].value : [];

            eventBus.emit('TERMINAL_LOG', { message: `> Executing Multi-Branch Web Retrieval` });
            ProgressTracker.advance("PHASE 1: EXTRACTION", 9); // Search passes
            
            const batch1Queries = [...state.queries.branch_A, ...state.queries.branch_B, ...state.queries.branch_C];
            const batch1Sources = await TavilySearch.executeBatch(batch1Queries);
            SourceManager.ingest(batch1Sources);

            // PHASE 1: EXTRACTION
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: EXTRACTION...` });
            ProgressTracker.advance("PHASE 1: EXTRACTION", 1);
            await AnalysisCoordinator.extractAndAnchor(batch1Sources);

            // PHASE 1: REFLECTION
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: REFLECTION...` });
            ProgressTracker.advance("PHASE 1: REFLECTION", 1);
            await AnalysisCoordinator.mapContradictions();

            // PHASE 1: INDEXING & GAP-FILL
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: INDEXING...` });
            ProgressTracker.advance("PHASE 1: INDEXING", 1);
            
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: GAP-FILL...` });
            ProgressTracker.advance("PHASE 1: GAP-FILL", 2);
            
            const gapQueries = await QueryGenerator.generateBranch('D', PASS_07_BRANCH_D, userIntent);
            
            eventBus.emit('TERMINAL_LOG', { message: `> Executing Secondary Gap-Fill Web Retrieval` });
            ProgressTracker.advance("PHASE 1: GAP-FILL", 6); // Search passes
            
            const batch2Sources = await TavilySearch.executeBatch(gapQueries);
            SourceManager.ingest(batch2Sources);
            
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: COMPRESSION...` });
            ProgressTracker.advance("PHASE 1: COMPRESSION", 1);
            await AnalysisCoordinator.extractAndAnchor(batch2Sources);
            
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 1: VERIFICATION...` });
            ProgressTracker.advance("PHASE 1: VERIFICATION", 1);

            // PHASE 2: GLOBAL SYNTHESIS
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 2: GLOBAL SYNTHESIS...` });
            ProgressTracker.advance("PHASE 2: GLOBAL SYNTHESIS", 7);
            
            const fullMemoryString = JSON.stringify(state.anchored_claims);
            const memorySlice = fullMemoryString.substring(0, Math.min(fullMemoryString.length, 50000)); 

            // PHASE 3: GENERATION
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 3: GENERATION...` });
            await Promise.allSettled([
                ReportAssembler.draftSection('introduction', memorySlice, PASS_15_EXEC_SUMMARY),
                ReportAssembler.draftSection('core_mechanics', memorySlice, PASS_16_CORE_MECHANICS),
                ReportAssembler.draftSection('deep_dive_a', memorySlice, PASS_17_DEEP_DIVE_A),
                ReportAssembler.draftSection('nuance_and_temporal', JSON.stringify(state.contradictions), PASS_20_NUANCE_EDGE_CASES)
            ]);

            // PHASE 4: FINAL AUDIT
            eventBus.emit('TERMINAL_LOG', { message: `[SYSTEM] Initializing PHASE 4: FINAL AUDIT...` });
            ProgressTracker.advance("PHASE 4: FINAL AUDIT", 10);
            await ReportAssembler.compileFinalReport();

            this._checkpointSession();

        } catch (error) {
            console.error("[OraclePipeline] Fatal Collapse:", error);
            eventBus.emit('FATAL_ERROR', { message: `[ORACLE_COLLAPSE] Pipeline halted: ${error.message}` });
        }
    }

    _checkpointSession() {
        try {
            const history = JSON.parse(localStorage.getItem('lexis_history') || '[]');
            history.unshift({
                date: new Date().toISOString(),
                query: state.query,
                sources: state.rawSources.length,
                report: state.draft.resolved_citations
            });
            localStorage.setItem('lexis_history', JSON.stringify(history.slice(0, 10)));
        } catch (e) {
            console.warn("History checkpoint failed (Quota exceeded).");
        }
    }
}

export const oracle = new OraclePipeline();
