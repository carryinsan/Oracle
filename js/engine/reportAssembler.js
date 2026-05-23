// js/engine/reportAssembler.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/writingPrompts.js';
import { eventBus } from '../core/eventBus.js';
import { citationManager } from './citationManager.js';

class ReportAssembler {
    async generateDraftSections(apiKey) {
        const client = new GeminiClient(apiKey);
        const style = researchState.get('STYLE_GUIDE');
        const memoryIndex = researchState.get('memory_index');
        
        // LENGTH INJECTOR: Force extreme length on all writing passes
        const lengthDirective = "\nCRITICAL LENGTH DIRECTIVE: You must write an exhaustive, deep-dive section. Minimum 2000 words. Expand on every single detail, data point, and nuance.";

        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Introduction...' });
        const intro = await client.streamContent(Prompts.PASS_15_WRITE_INTRO, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.intro || '')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Core Mechanics...' });
        const core = await client.streamContent(Prompts.PASS_16_WRITE_CORE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.technical || '')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Deep Dive A...' });
        const diveA = await client.streamContent(Prompts.PASS_17_WRITE_DIVE_A, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_1 || '')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Deep Dive B...' });
        const diveB = await client.streamContent(Prompts.PASS_18_WRITE_DIVE_B, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.deep_dive_2 || '')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Data & Metrics...' });
        const dataMetrics = await client.streamContent(Prompts.PASS_19_WRITE_DATA, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.statistical || '')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Nuance & Edge Cases...' });
        const nuance = await client.streamContent(Prompts.PASS_20_WRITE_NUANCE, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.contrarian || '')}\nCONTRADICTIONS: ${researchState.get('contradictions')}${lengthDirective}`);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Synthesizing Massive Conclusion...' });
        const conclusion = await client.streamContent(Prompts.PASS_21_WRITE_CONCLUSION, `STYLE: ${style}\nSLICE: ${JSON.stringify(memoryIndex.future || '')}${lengthDirective}`);

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
        
        // 1. Generate the core report via LLM
        let finalReport = await client.generateContent(Prompts.PASS_25_HUMANIZE_VERIFY, payload, false);
        
        // 2. NATIVE JAVASCRIPT BIBLIOGRAPHY GENERATOR (Prevents LLM laziness)
        eventBus.publish('PIPELINE_ACTION', { action: 'Appending Massive Raw Source Bibliography...' });
        const allClaims = researchState.get('anchored_claims') || [];
        
        // Deduplicate URLs to prevent identical links from appearing twice
        const uniqueUrls = [...new Set(allClaims.map(c => c.url))];
        
        let nativeBibliography = `\n\n---\n\n## Exhaustive Documented Sources (${uniqueUrls.length} Sources Verified)\n\n`;
        uniqueUrls.forEach((url, index) => {
            nativeBibliography += `**[${index + 1}]** ${url}\n\n`;
        });

        // 3. Weld the massive bibliography to the final report
        finalReport += nativeBibliography;

        researchState.update('sections.final_assembly', finalReport);
    }
}

export const reportAssembler = new ReportAssembler();
