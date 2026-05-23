// js/engine/analysisCoordinator.js
import { GeminiClient } from '../api/geminiClient.js';
import { OpenRouterClient } from '../api/openrouterClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/analysisPrompts.js';
import { eventBus } from '../core/eventBus.js';

class AnalysisCoordinator {
    async executeGlobalExtraction() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Extracting Claims from Branches A, B, C (via Gemini)...' });
        const extracted = await client.generateContent(Prompts.PASS_04_RANK, `SOURCES: ${JSON.stringify(researchState.get('raw_sources'))}`, false);
        researchState.update('anchored_claims', extracted);
    }
    async mapContradictions() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Mapping Epistemological Contradictions (via Gemini)...' });
        const contradictions = await client.generateContent(Prompts.PASS_05_REFLECT, `CLAIMS: ${researchState.get('anchored_claims')}`, false);
        researchState.update('contradictions', contradictions);
    }
    async indexMemory() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Indexing Semantic Memory (via Gemini)...' });
        const index = await client.generateContent(Prompts.PASS_06_THINK, `CLAIMS: ${researchState.get('anchored_claims')}`, true);
        researchState.update('memory_index', index);
    }
    async executeSecondaryExtraction() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Extracting Secondary Gap-Fill Sources (via Gemini)...' });
        const extracted = await client.generateContent(Prompts.PASS_09_RANK_SECONDARY, `SOURCES: ${JSON.stringify(researchState.get('raw_sources'))}`, false);
        researchState.update('anchored_claims', researchState.get('anchored_claims') + '\n' + extracted);
    }
    async compressCorpus() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Compressing Corpus to maximize Token Density (via Gemini)...' });
        const compressed = await client.generateContent(Prompts.PASS_10_COMPRESS, `CLAIMS: ${researchState.get('anchored_claims')}`, false);
        researchState.update('compressed_corpus', compressed);
    }
    async verifyCorpus() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Verifying Knowledge Base Integrity (via Gemini)...' });
        const verified = await client.generateContent(Prompts.PASS_11_VERIFY, `CORPUS: ${researchState.get('compressed_corpus')}`, false);
        researchState.update('verified_corpus', verified);
    }

    async mergeKnowledgeBase() {
        // MEGA PASS: DeepSeek V4 Pro swallows the entire 1 Million token context seamlessly!
        const client = new OpenRouterClient();
        const payload = `VERIFIED CORPUS: ${researchState.get('verified_corpus')}\nCONTRADICTIONS: ${JSON.stringify(researchState.get('contradictions'))}`;
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Massive Global Synthesis (via DeepSeek V4 Pro)...' });
        const compiled = await client.generateContent(Prompts.PASS_12_THINK, payload, false);
        researchState.update('Compiled_Knowledge_Base', compiled);
    }
}
export const analysisCoordinator = new AnalysisCoordinator();
