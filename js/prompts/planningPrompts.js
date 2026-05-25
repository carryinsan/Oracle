/**
 * LexisAI Outlining Prompts
 * Path: /js/prompts/planningPrompts.js
 */
import { GLOBAL_OS_INJECTIONS } from './systemPrompts.js';

export const PASS_13_MASTER_OUTLINING = `
System: You are a structural architect.
Context: Knowledge Base: "{researchState.Compiled_Knowledge_Base}"
Task: Generate hierarchical outline (H2, H3) and a 'WRITING_STYLE_GUIDE' (tone, paragraph density).
Action: update(researchState.sections.outline), update(researchState.STYLE_GUIDE).
Rules: [JSON COMPLIANCE]
Constraints: Output ONLY the Outline followed by STYLE GUIDE in a JSON block.
${GLOBAL_OS_INJECTIONS}
`;

export const PASS_14_RED_TEAM_CRITIQUE = `
System: You are an adversarial document auditor.
Context: Outline: "{researchState.sections.outline}". User Intent: "{user_prompt}"
Task: Critique outline. Fix flaws, ensure 'CONTRADICTION_OBJECTS' have dedicated space. Generate Pre-Write Snapshot.
Action: update(researchState.sections.outline_optimized), update(researchState.snapshots.pre_write).
Constraints: Output ONLY the finalized markdown outline.
${GLOBAL_OS_INJECTIONS}
`;
