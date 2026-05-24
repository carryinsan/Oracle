// js/engine/queryGenerator.js
import { GroqClient } from '../api/groqClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/researchPrompts.js';
import { eventBus } from '../core/eventBus.js';

class QueryGenerator {
    async generatePrimaryBranches() {
        const client = new GroqClient();
        const intent = researchState.get('user_prompt');

        // THE TOPIC LOCKDOWN: Binds the AI to your exact subject
        const topicLockdown = `\n\nCRITICAL DIRECTIVE: You MUST write queries strictly about the user's explicit intent: "${intent}". DO NOT copy example queries from the prompt. DO NOT write about random science topics unless explicitly requested. Focus 100% on the INTENT.`;

        // THE ADAPTIVE DIRECTIVE: Stops artificial criticism on factual subjects
        const branchBAdaptation = `\n\nCRITICAL DIRECTIVE: If the user's topic "${intent}" is purely educational, factual, or neutral (like a syllabus, history, or basic science concept), DO NOT force artificial criticisms or controversies. Instead, use this branch to find deep-dive information, advanced sub-topics, related applications, and comprehensive details.`;

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Primary Ontology Branch...' });
        const branchA = await client.generateContent(Prompts.PASS_01_ONTOLOGY, `INTENT: ${intent}${topicLockdown}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Advanced Context Branch...' });
        const branchB = await client.generateContent(Prompts.PASS_02_CONTRARIAN, `INTENT: ${intent}${topicLockdown}${branchBAdaptation}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Temporal & Trend Branch...' });
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

        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Secondary Gap-Fill Branch...' });
        const branchD = await client.generateContent(Prompts.PASS_07_GAP_FILL, `INTENT: ${intent}\nINDEX: ${memoryIndex}${topicLockdown}`, true);
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Nuance & Resolution Branch...' });
        const branchE = await client.generateContent(Prompts.PASS_08_CONTRADICTION_DEEPENING, `INTENT: ${intent}\nCONTRADICTIONS: ${contradictions}${topicLockdown}`, true);

        researchState.update('queries.branch_D', branchD);
        researchState.update('queries.branch_E', branchE);
    }
}
export const queryGenerator = new QueryGenerator();
