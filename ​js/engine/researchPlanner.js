// js/engine/researchPlanner.js
import { GeminiClient } from '../api/geminiClient.js';
import { researchState } from './researchState.js';
// Prompts injected in Part 6
import * as Prompts from '../prompts/planningPrompts.js';

class ResearchPlanner {
    async generateMasterOutline(apiKey) {
        const client = new GeminiClient(apiKey);
        const knowledgeBase = researchState.get('Compiled_Knowledge_Base');
        
        const structure = await client.generateContent(Prompts.PASS_13_ALIGN, knowledgeBase, true);
        
        researchState.update('sections.outline', structure.outline || "");
        researchState.update('STYLE_GUIDE', structure.style_guide || "");
    }

    async executeRedTeamCritique(apiKey) {
        const client = new GeminiClient(apiKey);
        const payload = `OUTLINE: ${researchState.get('sections.outline')}\nINTENT: ${researchState.get('user_prompt')}`;
        
        const optimizedOutline = await client.generateContent(Prompts.PASS_14_REFLECT, payload, false);
        researchState.update('sections.outline_optimized', optimizedOutline);
        researchState.update('snapshots.pre_write', optimizedOutline); // Pre-Write Snapshot
    }
}

export const researchPlanner = new ResearchPlanner();
