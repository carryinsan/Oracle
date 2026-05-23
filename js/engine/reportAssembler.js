// js/engine/reportAssembler.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/writingPrompts.js';
import { eventBus } from '../core/eventBus.js';

class ReportAssembler {
    async generateDraftSections(apiKey) {
        const client = new GeminiClient(apiKey);
        const style = researchState.get('STYLE_GUIDE');
        const memoryIndex = researchState.get('memory_index');
        
        // Execute writing tasks sequentially to prevent 429 Rate Limits
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Introduction...' });
        const intro = await client.streamContent(Prompts.PASS_15_WRITE_INTRO, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.intro || '')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Core Mechanics...' });
        const core = await client.streamContent(Prompts.PASS_16_WRITE_CORE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.technical || '')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Deep Dive A...' });
        const diveA = await client.streamContent(Prompts.PASS_17_WRITE_DIVE_A, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_1 || '')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Deep Dive B...' });
        const diveB = await client.streamContent(Prompts.PASS_18_WRITE_DIVE_B, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_2 || '')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Data & Metrics...' });
        const dataMetrics = await client.streamContent(Prompts.PASS_19_WRITE_DATA, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.statistical || '')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Nuance & Edge Cases...' });
        const nuance = await client.streamContent(Prompts.PASS_20_WRITE_NUANCE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.contrarian || '')}\nCONTRADICTIONS: ${researchState.get('contradictions')}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Conclusion...' });
        const conclusion = await client.streamContent(Prompts.PASS_21_WRITE_CONCLUSION, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.future || '')}`);

        // Update the singleton state with the drafted text
        researchState.update('sections.introduction', intro);
        researchState.update('sections.core_mechanics', core);
        researchState.update('sections.deep_dive_a', diveA);
        researchState.update('sections.deep_dive_b', diveB);
        researchState.update('sections.data_metrics', dataMetrics);
        researchState.update('sections.nuance_and_temporal', nuance);
        researchState.update('sections.conclusion', conclusion);
    }

    async reconstructCitations(apiKey) {
        const client = new GeminiClient(apiKey);
        const rawDraft = Object.values(researchState.get('sections')).join('\n\n');
        const payload = `DRAFT: ${rawDraft}\nANCHORS: ${JSON.stringify(researchState.get('anchored_claims'))}`;
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Resolving Cryptographic Citations...' });
        const resolved = await client.generateContent(Prompts.PASS_22_CITATION, payload, false);
        researchState.update('draft.resolved_citations', resolved);
    }

    async smoothTransitions(apiKey) {
        const client = new GeminiClient(apiKey);
        const draft = researchState.get('draft.resolved_citations');
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Applying Narrative Smoothing...' });
        const smoothed = await client.generateContent(Prompts.PASS_23_ALIGN_COMPRESS, draft, false);
        researchState.update('draft.smoothed_and_compressed', smoothed);
    }

    async executeIntegrityAudit(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `DRAFT: ${researchState.get('draft.smoothed_and_compressed')}\nCONTRADICTIONS: ${researchState.get('contradictions')}`;
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Cognitive Integrity Audit...' });
        const audit = await client.generateContent(Prompts.PASS_24_REFLECT_AUDIT, payload, false);
        researchState.update('integrity_audit', audit);
    }

    async finalizeReport(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `DRAFT: ${researchState.get('draft.smoothed_and_compressed')}\nAUDIT: ${researchState.get('integrity_audit')}\nSTYLE: ${researchState.get('STYLE_GUIDE')}`;
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Finalizing Report Verification...' });
        const finalReport = await client.generateContent(Prompts.PASS_25_HUMANIZE_VERIFY, payload, false);
        researchState.update('sections.final_assembly', finalReport);
    }
}

export const reportAssembler = new ReportAssembler();
