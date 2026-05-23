// js/engine/queryGenerator.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/researchPrompts.js';
import { eventBus } from '../core/eventBus.js';

class QueryGenerator {
    async generatePrimaryBranches(apiKey) {
        const client = new GeminiClient(apiKey);
        const intent = researchState.get('user_prompt');

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Ontology Branch...' });
        const branchA = await client.generateContent(Prompts.PASS_01_ONTOLOGY, `INTENT: ${intent}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Contrarian Branch...' });
        const branchB = await client.generateContent(Prompts.PASS_02_CONTRARIAN, `INTENT: ${intent}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Temporal Branch...' });
        const branchC = await client.generateContent(Prompts.PASS_03_TEMPORAL, `INTENT: ${intent}`, true);

        researchState.update('queries.branch_A', branchA);
        researchState.update('queries.branch_B', branchB);
        researchState.update('queries.branch_C', branchC);
    }

    async generateSecondaryBranches(apiKey) {
        const client = new GeminiClient(apiKey);
        const memoryIndex = JSON.stringify(researchState.get('memory_index'));
        const contradictions = JSON.stringify(researchState.get('contradictions'));

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Gap-Fill Branch...' });
        const branchD = await client.generateContent(Prompts.PASS_07_GAP_FILL, `INDEX: ${memoryIndex}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Contradiction Resolution Branch...' });
        const branchE = await client.generateContent(Prompts.PASS_08_CONTRADICTION_DEEPENING, `CONTRADICTIONS: ${contradictions}`, true);

        researchState.update('queries.branch_D', branchD);
        researchState.update('queries.branch_E', branchE);
    }
}

export const queryGenerator = new QueryGenerator();
