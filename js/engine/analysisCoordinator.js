// js/engine/analysisCoordinator.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/analysisPrompts.js';
import { eventBus } from '../core/eventBus.js';

class AnalysisCoordinator {
    
    // UTILITY: Mathematically chunks massive arrays into safe TPM payloads
    _chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async executeGlobalExtraction(apiKey) {
        const client = new GeminiClient(apiKey);
        const sources = researchState.get('raw_sources') || [];
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Global Extraction...' });
        
        const payload = `Raw Data: ${JSON.stringify(sources.slice(0, 50))}`; 
        const extraction = await client.generateContent(Prompts.PASS_04_RANK, payload, false);
        researchState.update('anchored_claims', [{ id: 'batch_1', content: extraction }]);
    }

    async mapContradictions(apiKey) {
        const client = new GeminiClient(apiKey);
        eventBus.publish('PIPELINE_ACTION', { action: 'Mapping Contradictions...' });
        
        const payload = `Anchored Claims: ${JSON.stringify(researchState.get('anchored_claims'))}`;
        const contradictions = await client.generateContent(Prompts.PASS_05_REFLECT, payload, false);
        researchState.update('contradictions', contradictions);
    }

    async indexMemory(apiKey) {
        const client = new GeminiClient(apiKey);
        eventBus.publish('PIPELINE_ACTION', { action: 'Indexing Semantic Memory...' });
        
        const payload = `Anchored Claims: ${JSON.stringify(researchState.get('anchored_claims'))}`;
        const memory = await client.generateContent(Prompts.PASS_06_THINK, payload, true);
        researchState.update('memory_index', memory);
    }

    async executeSecondaryExtraction(apiKey) {
        const client = new GeminiClient(apiKey);
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Secondary Extraction...' });
        
        const sources = researchState.get('raw_sources') || [];
        const payload = `Raw Data: ${JSON.stringify(sources.slice(50, 100))}`;
        const extraction = await client.generateContent(Prompts.PASS_09_RANK_SECONDARY, payload, false);
        
        const existing = researchState.get('anchored_claims') || [];
        researchState.update('anchored_claims', [...existing, { id: 'batch_2', content: extraction }]);
    }

    async compressCorpus(apiKey) {
        const client = new GeminiClient(apiKey);
        eventBus.publish('PIPELINE_ACTION', { action: 'Compressing Corpus...' });
        
        const payload = `Claims: ${JSON.stringify(researchState.get('anchored_claims'))}`;
        const compressed = await client.generateContent(Prompts.PASS_10_COMPRESS, payload, false);
        researchState.update('compressed_corpus', compressed);
    }

    async verifyCorpus(apiKey) {
        const client = new GeminiClient(apiKey);
        eventBus.publish('PIPELINE_ACTION', { action: 'Verifying Corpus...' });
        
        const payload = `Compressed Corpus: ${researchState.get('compressed_corpus')}`;
        const verified = await client.generateContent(Prompts.PASS_11_VERIFY, payload, false);
        researchState.update('verified_corpus', verified);
    }

    // THE ULTIMATE 429 TPM FIX: INCREMENTAL SYNTHESIS
    async mergeKnowledgeBase(apiKey) {
        const client = new GeminiClient(apiKey);
        const allSources = researchState.get('raw_sources') || [];
        
        eventBus.publish('PIPELINE_ACTION', { action: `Initializing Incremental Synthesis for ${allSources.length} sources...` });
        
        // Chunk sources into safe batches of 30 to stay strictly below TPM Limits
        const sourceChunks = this._chunkArray(allSources, 30);
        let synthesizedChunks = [];

        for (let i = 0; i < sourceChunks.length; i++) {
            eventBus.publish('PIPELINE_ACTION', { action: `Synthesizing Source Chunk ${i + 1} of ${sourceChunks.length}...` });
            
            const chunkPayload = `Verified Corpus Context: ${researchState.get('verified_corpus')}\nSource Batch: ${JSON.stringify(sourceChunks[i])}\nContradictions: ${researchState.get('contradictions')}`;
            const chunkSynthesis = await client.generateContent(Prompts.PASS_12_THINK, chunkPayload, false);
            
            synthesizedChunks.push(chunkSynthesis);
        }

        eventBus.publish('PIPELINE_ACTION', { action: 'Merging Chunked Knowledge Base...' });
        
        const finalMergePayload = `Synthesized Chunks: ${JSON.stringify(synthesizedChunks)}`;
        const finalKnowledgeBase = await client.generateContent(Prompts.PASS_12_THINK, finalMergePayload, false);

        researchState.update('Compiled_Knowledge_Base', finalKnowledgeBase);
    }
}

export const analysisCoordinator = new AnalysisCoordinator();
