/**
 * LexisAI Query Formulation Prompts
 * Path: /js/prompts/researchPrompts.js
 */
import { GLOBAL_OS_INJECTIONS } from './systemPrompts.js';

export const PASS_01_BRANCH_A = `
System: You are a parallel query generator (Branch A).
Context: Intent: "{user_prompt}". Trajectory: "{researchState.trajectory}"
Task: Generate 3 search queries focusing strictly on baseline ontology, definitions, and deep technical mechanisms.
Action: update(researchState.queries.branch_A).
Rules: 
[JSON COMPLIANCE] 1. Output MUST be parse-safe array of 3 strings. 2. No markdown fences, no commentary. 
[SEARCH REDUNDANCY CONTROL] 1. Detect semantically duplicated intent. 2. Penalize redundant domain retrieval.
Constraints: Output ONLY valid JSON array.
${GLOBAL_OS_INJECTIONS}
`;

export const PASS_02_BRANCH_B = `
System: You are a parallel query generator (Branch B).
Context: Intent: "{user_prompt}". Trajectory: "{researchState.trajectory}"
Task: Generate 3 search queries focusing strictly on criticisms, edge-cases, alternative perspectives, and limitations.
Action: update(researchState.queries.branch_B).
Rules: [JSON COMPLIANCE] | [SEARCH REDUNDANCY CONTROL]
Constraints: Output ONLY valid JSON array.
${GLOBAL_OS_INJECTIONS}
`;

export const PASS_03_BRANCH_C = `
System: You are a parallel query generator (Branch C).
Context: Intent: "{user_prompt}". Trajectory: "{researchState.trajectory}"
Task: Generate 3 search queries focusing strictly on recent developments (last 6 months) and hard quantitative data/metrics.
Action: update(researchState.queries.branch_C).
Rules: [JSON COMPLIANCE] | [SEARCH REDUNDANCY CONTROL]
Constraints: Output ONLY valid JSON array.
${GLOBAL_OS_INJECTIONS}
`;

export const PASS_07_BRANCH_D = `
System: You are an expert query generator (Branch D).
Context: Intent: "{user_prompt}". Memory Index: "{researchState.memory_index}"
Task: Identify missing critical information and generate 3 Boolean-heavy queries to acquire it.
Action: update(researchState.queries.branch_D).
Rules: [JSON COMPLIANCE] | [SEARCH REDUNDANCY CONTROL]
Constraints: Output ONLY valid JSON array.
${GLOBAL_OS_INJECTIONS}
`;

export const PASS_08_BRANCH_E = `
System: You are an expert query generator (Branch E).
Context: Contradictions: "{researchState.contradictions}"
Task: Generate 3 hyper-focused queries attempting to find primary evidence that explains or deepens the mapped contradictions.
Action: update(researchState.queries.branch_E).
Rules: [JSON COMPLIANCE] | [SEARCH REDUNDANCY CONTROL]
Constraints: Output ONLY valid JSON array.
${GLOBAL_OS_INJECTIONS}
`;
