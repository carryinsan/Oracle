// js/engine/analysisCoordinator.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
// Prompts injected in Part 6
import * as Prompts from '../prompts/analysisPrompts.js';

class AnalysisCoordinator {
    async executeGlobalExtraction(apiKey) {
        const client = new GeminiClient(apiKey);
        const rawData = JSON.stringify(researchState.get('raw').slice(0, 15)); // First 15 searches
        
        const extractedText = await client.generateContent(Prompts.PASS_04_RANK, `DATA: ${rawData}`, false);
        // Mock appending string output. CitationManager intercepts specific claim logic.
        researchState.update('anchored_claims', extractedText);
    }

    async mapContradictions(apiKey) {
        const client = new GeminiClient(apiKey);
        const claims = researchState.get('anchored_claims');
        
        const contradictions = await client.generateContent(Prompts.PASS_05_REFLECT, claims, false);
        researchState.update('contradictions', contradictions);
    }

    async indexMemory(apiKey) {
        const client = new GeminiClient(apiKey);
        const data = `CLAIMS: ${researchState.get('anchored_claims')}\nCONTRADICTIONS: ${researchState.get('contradictions')}`;
        
        const index = await client.generateContent(Prompts.PASS_06_THINK, data, true);
        researchState.update('memory_index', index);
    }

    async executeSecondaryExtraction(apiKey) {
        const client = new GeminiClient(apiKey);
        const secondaryRaw = JSON.stringify(researchState.get('raw').slice(15)); // Final 15 searches
        
        const extractedText = await client.generateContent(Prompts.PASS_09_RANK_SECONDARY, `DATA: ${secondaryRaw}`, false);
        const currentClaims = researchState.get('anchored_claims');
        researchState.update('anchored_claims', currentClaims + '\n' + extractedText);
    }

    async compressCorpus(apiKey) {
        const client = new GeminiClient(apiKey);
        const claims = researchState.get('anchored_claims');
        
        const compressed = await client.generateContent(Prompts.PASS_10_COMPRESS, claims, false);
        researchState.update('compressed_corpus', compressed);
    }

    async verifyCorpus(apiKey) {
        const client = new GeminiClient(apiKey);
        const corpus = researchState.get('compressed_corpus');
        
        const verified = await client.generateContent(Prompts.PASS_11_VERIFY, corpus, false);
        researchState.update('verified_corpus', verified);
        researchState.update('snapshots.phase1', verified); // Failsafe Snapshot
    }

    async mergeKnowledgeBase(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `CORPUS: ${researchState.get('verified_corpus')}\nCONTRADICTIONS: ${researchState.get('contradictions')}`;
        
        const knowledgeBase = await client.generateContent(Prompts.PASS_12_THINK, payload, false);
        researchState.update('Compiled_Knowledge_Base', knowledgeBase);
    }
}

export const analysisCoordinator = new AnalysisCoordinator();
