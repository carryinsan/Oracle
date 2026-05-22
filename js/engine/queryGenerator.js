// js/engine/queryGenerator.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
// Prompts injected in Part 6
import * as Prompts from '../prompts/researchPrompts.js';

class QueryGenerator {
    async generatePrimaryBranches(apiKey) {
        const client = new GeminiClient(apiKey);
        const intent = researchState.get('user_prompt');

        // Execute Passes 01, 02, and 03 in parallel to save time
        const [branchA, branchB, branchC] = await Promise.all([
            client.generateContent(Prompts.PASS_01_ONTOLOGY, `INTENT: ${intent}`, true),
            client.generateContent(Prompts.PASS_02_CONTRARIAN, `INTENT: ${intent}`, true),
            client.generateContent(Prompts.PASS_03_TEMPORAL, `INTENT: ${intent}`, true)
        ]);

        researchState.update('queries.branch_A', branchA);
        researchState.update('queries.branch_B', branchB);
        researchState.update('queries.branch_C', branchC);
    }

    async generateSecondaryBranches(apiKey) {
        const client = new GeminiClient(apiKey);
        
        // Context pulled from Pass 06 (Memory Index) and Pass 05 (Contradictions)
        const memoryIndex = JSON.stringify(researchState.get('memory_index'));
        const contradictions = JSON.stringify(researchState.get('contradictions'));

        const [branchD, branchE] = await Promise.all([
            client.generateContent(Prompts.PASS_07_GAP_FILL, `INDEX: ${memoryIndex}`, true),
            client.generateContent(Prompts.PASS_08_CONTRADICTION_DEEPENING, `CONTRADICTIONS: ${contradictions}`, true)
        ]);

        researchState.update('queries.branch_D', branchD);
        researchState.update('queries.branch_E', branchE);
    }
}

export const queryGenerator = new QueryGenerator();
