// js/engine/analysisCoordinator.js
import { GeminiClient } from '../api/geminiClient.js';
import { OpenRouterClient } from '../api/openrouterClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/analysisPrompts.js';
import { eventBus } from '../core/eventBus.js';

class AnalysisCoordinator {
    async executeGlobalExtraction() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Extracting Core Claims from Raw Data...' });
        const extracted = await client.generateContent(Prompts.PASS_04_RANK, `SOURCES: ${JSON.stringify(researchState.get('raw_sources'))}`, false);
        researchState.update('anchored_claims', extracted);
    }
    async mapContradictions() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Mapping Data Nuances and Edge Cases...' });
        const contradictions = await client.generateContent(Prompts.PASS_05_REFLECT, `CLAIMS: ${researchState.get('anchored_claims')}`, false);
        researchState.update('contradictions', contradictions);
    }
    async indexMemory() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Indexing Semantic Memory...' });
        const index = await client.generateContent(Prompts.PASS_06_THINK, `CLAIMS: ${researchState.get('anchored_claims')}`, true);
        researchState.update('memory_index', index);
    }
    async executeSecondaryExtraction() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Extracting Secondary Gap-Fill Sources...' });
        const extracted = await client.generateContent(Prompts.PASS_09_RANK_SECONDARY, `SOURCES: ${JSON.stringify(researchState.get('raw_sources'))}`, false);
        researchState.update('anchored_claims', researchState.get('anchored_claims') + '\n' + extracted);
    }
    async compressCorpus() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Compressing Corpus to maximize Token Density...' });
        const compressed = await client.generateContent(Prompts.PASS_10_COMPRESS, `CLAIMS: ${researchState.get('anchored_claims')}`, false);
        researchState.update('compressed_corpus', compressed);
    }
    async verifyCorpus() {
        const client = new GeminiClient();
        eventBus.publish('PIPELINE_ACTION', { action: 'Verifying Knowledge Base Integrity...' });
        const verified = await client.generateContent(Prompts.PASS_11_VERIFY, `CORPUS: ${researchState.get('compressed_corpus')}`, false);
        researchState.update('verified_corpus', verified);
    }

    async mergeKnowledgeBase() {
        const client = new OpenRouterClient();
        const payload = `VERIFIED CORPUS: ${researchState.get('verified_corpus')}\nCONTRADICTIONS: ${JSON.stringify(researchState.get('contradictions'))}`;
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Massive Global Synthesis...' });
        const compiled = await client.generateContent(Prompts.PASS_12_THINK, payload, false);
        researchState.update('Compiled_Knowledge_Base', compiled);
    }
}
export const analysisCoordinator = new AnalysisCoordinator();
