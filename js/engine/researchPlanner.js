// js/engine/researchPlanner.js
import { GroqClient } from '../api/groqClient.js';
import { researchState } from './researchState.js';
import * as Prompts from '../prompts/planningPrompts.js';
import { eventBus } from '../core/eventBus.js';

class ResearchPlanner {
    async generateMasterOutline() {
        const client = new GroqClient();
        const payload = `KNOWLEDGE BASE: ${researchState.get('Compiled_Knowledge_Base')}`;
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Generating Structural Outline (via Groq Llama Scout)...' });
        const outline = await client.generateContent(Prompts.PASS_13_OUTLINE, payload, false);
        researchState.update('master_outline', outline);
    }

    async executeRedTeamCritique() {
        const client = new GroqClient();
        const payload = `OUTLINE: ${researchState.get('master_outline')}\nCONTRADICTIONS: ${JSON.stringify(researchState.get('contradictions'))}`;
        
        eventBus.publish('PIPELINE_ACTION', { action: 'Executing Red-Team Critique (via Groq Llama Scout)...' });
        const critique = await client.generateContent(Prompts.PASS_14_CRITIQUE, payload, false);
        researchState.update('red_team_critique', critique);
    }
}
export const researchPlanner = new ResearchPlanner();
