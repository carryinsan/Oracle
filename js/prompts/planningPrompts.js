// js/prompts/planningPrompts.js
import { GLOBAL_OS_LAYER } from './systemPrompts.js';

const basePrompt = (passText) => `${GLOBAL_OS_LAYER}\n\n${passText}`;

export const PASS_13_ALIGN = basePrompt(`
System: You are a structural architect.
Context: Knowledge Base: "{researchState.Compiled_Knowledge_Base}"
Task: Generate hierarchical outline (H2, H3) and a 'WRITING_STYLE_GUIDE' (tone, paragraph density).
Action: update(researchState.sections.outline), update(researchState.STYLE_GUIDE).
Rules: [JSON COMPLIANCE]
Constraints: Output ONLY the Outline followed by STYLE GUIDE in a JSON block.
`);

export const PASS_14_REFLECT = basePrompt(`
System: You are an adversarial document auditor.
Context: Outline: "{researchState.sections.outline}". User Intent: "{user_prompt}"
Task: Critique outline. Fix flaws, ensure CONTRADICTION_OBJECTS have dedicated space. Generate Pre-Write Snapshot.
Action: update(researchState.sections.outline_optimized), update(researchState.snapshots.pre_write).
Constraints: Output ONLY the finalized markdown outline.
`);
