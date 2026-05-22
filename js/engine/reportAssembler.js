// js/engine/reportAssembler.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
// Prompts injected in Part 6
import * as Prompts from '../prompts/writingPrompts.js';

class ReportAssembler {
    async generateDraftSections(apiKey) {
        const client = new GeminiClient(apiKey);
        const style = researchState.get('STYLE_GUIDE');
        const memoryIndex = researchState.get('memory_index');
        
        // Pass 15-21: Execute Writing Prompts in Parallel using SSE streams
        // Streaming emits directly to the DOM via GeminiStreamer during these calls
        const writingTasks = [
            client.streamContent(Prompts.PASS_15_WRITE_INTRO, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.intro)}`),
            client.streamContent(Prompts.PASS_16_WRITE_CORE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.technical)}`),
            client.streamContent(Prompts.PASS_17_WRITE_DIVE_A, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_1)}`),
            client.streamContent(Prompts.PASS_18_WRITE_DIVE_B, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_2)}`),
            client.streamContent(Prompts.PASS_19_WRITE_DATA, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.statistical)}`),
            client.streamContent(Prompts.PASS_20_WRITE_NUANCE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.contrarian)}\nCONTRADICTIONS: ${researchState.get('contradictions')}`),
            client.streamContent(Prompts.PASS_21_WRITE_CONCLUSION, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.future)}`)
        ];

        // Wait for all streams to finish generating chunks
        await Promise.all(writingTasks);
        
        // In a full implementation, the stream callbacks append directly to researchState.sections.
        // For orchestration flow mapping, we proceed to Pass 22 once parallel execution resolves.
    }

    async reconstructCitations(apiKey) {
        const client = new GeminiClient(apiKey);
        // Combine raw section chunks
        const rawDraft = Object.values(researchState.get('sections')).join('\n\n');
        const payload = `DRAFT: ${rawDraft}\nANCHORS: ${JSON.stringify(researchState.get('anchored_claims'))}`;
        
        const resolved = await client.generateContent(Prompts.PASS_22_CITATION, payload, false);
        researchState.update('draft.resolved_citations', resolved);
    }

    async smoothTransitions(apiKey) {
        const client = new GeminiClient(apiKey);
        const draft = researchState.get('draft.resolved_citations');
        
        const smoothed = await client.generateContent(Prompts.PASS_23_ALIGN_COMPRESS, draft, false);
        researchState.update('draft.smoothed_and_compressed', smoothed);
    }

    async executeIntegrityAudit(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `DRAFT: ${researchState.get('draft.smoothed_and_compressed')}\nCONTRADICTIONS: ${researchState.get('contradictions')}`;
        
        const audit = await client.generateContent(Prompts.PASS_24_REFLECT_AUDIT, payload, false);
        researchState.update('integrity_audit', audit);
    }

    async finalizeReport(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `DRAFT: ${researchState.get('draft.smoothed_and_compressed')}\nAUDIT: ${researchState.get('integrity_audit')}\nSTYLE: ${researchState.get('STYLE_GUIDE')}`;
        
        const finalReport = await client.generateContent(Prompts.PASS_25_HUMANIZE_VERIFY, payload, false);
        // Mount to report viewer state
        researchState.update('sections.final_assembly', finalReport);
    }
}

export const reportAssembler = new ReportAssembler();
