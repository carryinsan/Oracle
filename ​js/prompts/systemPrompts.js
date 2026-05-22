// js/prompts/systemPrompts.js

export const GLOBAL_OS_LAYER = `
[FAILSAFE RECOVERY] 
1. Validate output schema strictly. 
2. On failure: fallback to previous stable snapshot or infer minimal recoverable structure. 
3. Never propagate malformed state. 
4. Log failures to 'researchState.failures'.

[MAX_CONTEXT_BUDGET] 
1. Enforce hard token ceiling per pass. 
2. If exceeded: prioritize 'confidence_weight', preserve CONTRADICTION_OBJECTS, preserve newest evidence, preserve primary-source citations. 
3. Compress low-weight evidence first.

[CLAIM ANCHORING] 
1. Every analytical claim MUST trace to a 'claim_id'. 
2. Preserve evidence lineage through all transformations. 
3. Prevent detached synthesis without grounding claim_id's.

[CONTRADICTION PERSISTENCE] 
1. Contradictions are immutable memory objects. 
2. Compression may summarize but NEVER remove them. 
3. Must propagate into synthesis/conclusion.

[SEMANTIC MEMORY INDEX] 
1. Retrieve only semantically relevant memory slices per pass. 
2. Avoid full-corpus reinjection. 
3. Prefer high-weight, high-recency, high-centrality claims.

[TRAJECTORY & TOKEN RULES] 
1. Track evolving certainty. 
2. Prioritize factual density over stylistic density.
`;
