// js/engine/queryGenerator.js
import { GroqClient } from '../api/groqClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/researchPrompts.js';
import { eventBus } from '../core/eventBus.js';

class QueryGenerator {
    async generatePrimaryBranches() {
        const client = new GroqClient();
        const intent = researchState.get('user_prompt');

        // THE TOPIC LOCKDOWN: Forces Llama 3 to ignore generic examples and bind strictly to the user's query.
        const topicLockdown = `\n\nCRITICAL DIRECTIVE: You MUST write queries strictly about the user's explicit intent: "${intent}". DO NOT copy example queries from the prompt. DO NOT write about quantum mechanics, thermodynamics, vaccines, or random science topics unless the user explicitly asked for them. Focus 100% on the INTENT.`;

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Ontology Branch (via Groq Llama Scout)...' });
        const branchA = await client.generateContent(Prompts.PASS_01_ONTOLOGY, `INTENT: ${intent}${topicLockdown}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Contrarian Branch (via Groq Llama Scout)...' });
        const branchB = await client.generateContent(Prompts.PASS_02_CONTRARIAN, `INTENT: ${intent}${topicLockdown}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Temporal Branch (via Groq Llama Scout)...' });
        const branchC = await client.generateContent(Prompts.PASS_03_TEMPORAL, `INTENT: ${intent}${topicLockdown}`, true);

        researchState.update('queries.branch_A', branchA);
        researchState.update('queries.branch_B', branchB);
        researchState.update('queries.branch_C', branchC);
    }

    async generateSecondaryBranches() {
        const client = new GroqClient();
        const intent = researchState.get('user_prompt');
        const memoryIndex = JSON.stringify(researchState.get('memory_index'));
        const contradictions = JSON.stringify(researchState.get('contradictions'));

        const topicLockdown = `\n\nCRITICAL DIRECTIVE: Your queries MUST be strictly related to the user's original topic: "${intent}". Do not drift into generic examples.`;

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Gap-Fill Branch (via Groq Llama Scout)...' });
        const branchD = await client.generateContent(Prompts.PASS_07_GAP_FILL, `INTENT: ${intent}\nINDEX: ${memoryIndex}${topicLockdown}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Contradiction Branch (via Groq Llama Scout)...' });
        const branchE = await client.generateContent(Prompts.PASS_08_CONTRADICTION_DEEPENING, `INTENT: ${intent}\nCONTRADICTIONS: ${contradictions}${topicLockdown}`, true);

        researchState.update('queries.branch_D', branchD);
        researchState.update('queries.branch_E', branchE);
    }
}
export const queryGenerator = new QueryGenerator();
