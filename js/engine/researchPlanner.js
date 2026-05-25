/**
 * LexisAI DAG Generator
 * Path: /js/engine/researchPlanner.js
 */
import { groqClient } from '../api/groqClient.js';
import { state } from './researchState.js';
import { eventBus } from '../core/eventBus.js';

// [FIX APPLIED]: Mapped to the specific PASS_13 variable
import { PASS_13_MASTER_OUTLINING } from '../prompts/planningPrompts.js';

export class ResearchPlanner {
    static async generateDAG(userIntent) {
        try {
            eventBus.emit('TERMINAL_LOG', { message: `[PLANNER] Constructing Directed Acyclic Graph (DAG) for intent...` });
            
            const messages = [
                { role: "system", content: PASS_13_MASTER_OUTLINING },
                { role: "user", content: userIntent }
            ];

            const plan = await groqClient.generateJSON(messages);
            
            // Validate and store the plan safely
            state.sections.outline = Array.isArray(plan.outline) ? plan.outline.join('\n') : "1. Introduction\n2. Core Analysis\n3. Conclusion";
            state.STYLE_GUIDE = plan.style_guide || "Academic and objective.";
            
            eventBus.emit('TERMINAL_LOG', { message: `[PLANNER] DAG mapped successfully. Style target locked.` });
        } catch (error) {
            console.warn("[ResearchPlanner] DAG Generation degraded. Applying fallback.", error);
            state.sections.outline = "1. Introduction\n2. Analysis\n3. Conclusion";
            state.STYLE_GUIDE = "Strictly factual.";
        }
    }
}
