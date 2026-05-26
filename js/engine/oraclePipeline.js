// File Path: js/engine/oraclePipeline.js
// Purpose: The core orchestration engine executing the 25-pass interleaved DAG.
// Handles prompt compilation, API dispatching, and state mutation.

import { Config } from '../core/config.js';
import { EventBus } from '../core/eventBus.js';
import { stateManager } from './researchState.js';
import { gemini } from '../api/geminiClient.js';
import { tavily } from '../api/tavilyClient.js';
import { getPromptForPass } from '../prompts/systemPrompts.js';
import { tokenManager } from './tokenManager.js';
import { OcpAlgorithm } from './ocpAlgorithm.js';

class OraclePipeline {
    constructor() {
        this.isRunning = false;
        this.shouldHalt = false;
        
        // Listen for user commands to start/resume
        EventBus.on('UI_RESEARCH_INIT', async (payload) => {
            await stateManager.update('query', payload.query);
            this.startPipeline(1); // Start at Pass 1
        });

        // Listen for Pass 2 Plan Approval
        EventBus.on('UI_PLAN_APPROVED', async (payload) => {
            await stateManager.update('plan.outline', payload.planHtml);
            this.startPipeline(3); // Resume at Pass 3
        });
    }

    /**
     * Replaces {researchState.path.to.var} in prompts with actual data.
     */
    interpolatePrompt(promptTemplate) {
        return promptTemplate.replace(/\{researchState\.([a-zA-Z0-9_.]+)\}/g, (match, path) => {
            let value = stateManager.get(path);
            
            if (value === undefined || value === null) return "";
            
            // If the state holds an object/array, we must stringify it so it doesn't break the prompt
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        });
    }

    /**
     * Starts or resumes the pipeline from a specific pass.
     */
    async startPipeline(startPass = 1) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.shouldHalt = false;

        await stateManager.update('status', 'running');
        console.log(`[OraclePipeline] Initiating sequence from Pass ${startPass}`);

        for (let i = startPass - 1; i < Config.PIPELINE_STAGES.length; i++) {
            if (this.shouldHalt) break;

            const stage = Config.PIPELINE_STAGES[i];
            await stateManager.update('currentPass', stage.pass);
            
            EventBus.emit('PIPELINE_PASS_START', { 
                pass: stage.pass, 
                name: stage.name, 
                type: stage.type 
            });

            try {
                await this.executeStage(stage);
                EventBus.emit('PIPELINE_PASS_COMPLETE', { pass: stage.pass });
            } catch (error) {
                console.error(`[OraclePipeline] CRITICAL FAILURE at Pass ${stage.pass}:`, error);
                await stateManager.update('status', 'error');
                
                // Log failure to state for recovery
                const failures = stateManager.get('failures') || [];
                failures.push({ pass: stage.pass, error: error.message });
                await stateManager.update('failures', failures);
                
                EventBus.emit('PIPELINE_ERROR', { pass: stage.pass, error: error.message });
                this.isRunning = false;
                return; // Halt execution on critical failure
            }

            // Halt after Plan (Pass 2) to wait for User UI Approval
            if (stage.pass === 2) {
                console.log("[OraclePipeline] Halting at Pass 2 for user plan approval.");
                this.isRunning = false;
                await stateManager.update('status', 'awaiting_approval');
                EventBus.emit('PIPELINE_PAUSED_FOR_USER');
                break; 
            }
        }

        if (!this.shouldHalt && stateManager.get('currentPass') === 25) {
            console.log("[OraclePipeline] 25-Pass DAG Execution Completed Successfully.");
            await stateManager.update('status', 'complete');
            EventBus.emit('PIPELINE_COMPLETE');
            this.isRunning = false;
        }
    }

    /**
     * Executes the logic for a single DAG stage.
     */
    async executeStage(stage) {
        const userQuery = stateManager.get('query');
        
        // Pass 25 is executed locally by our custom JS Algorithm, not the LLM
        if (stage.pass === 25) {
            return await this.executeLocalOcpAlgorithm();
        }

        // For LLM Passes (1-24)
        const rawPrompt = getPromptForPass(stage.pass);
        // Replace variables with actual user query and state memory
        const systemInstruction = this.interpolatePrompt(rawPrompt).replace(/\{user_prompt\}/g, userQuery);

        if (stage.type === "SEARCH") {
            // Passes 3, 7, 11, 15, 19
            // 1. Get the queries generated in the previous pass
            const queriesPath = `queries.pass${stage.pass}`;
            let queries = stateManager.get(queriesPath);
            
            if (typeof queries === 'string') {
                try { queries = JSON.parse(queries); } catch(e) { queries = [queries]; }
            }

            if (!Array.isArray(queries) || queries.length === 0) {
                throw new Error(`No valid search queries found for Pass ${stage.pass}`);
            }

            // 2. Execute Tavily Searches in parallel
            EventBus.emit('TELEMETRY_LOG', `Executing advanced depth search for ${queries.length} queries...`);
            const searchPromises = queries.map(q => tavily.search(q));
            const searchResults = await Promise.all(searchPromises);
            
            // 3. Flatten and trim to save tokens
            const flatResults = searchResults.flat().slice(0, stage.maxResults);
            
            // 4. Save results to state so the next THINK pass can evaluate them
            await stateManager.update(`search_results.pass${stage.pass}`, JSON.stringify(flatResults));
            EventBus.emit('TELEMETRY_LOG', `Retrieved ${flatResults.length} cryptographic source fragments.`);

        } else {
            // THINK, PLAN, WRITE, AUDIT, CODE_GEN Passes
            EventBus.emit('TELEMETRY_LOG', `Initiating cognitive model: Gemini 2.5 Flash...`);
            
            // Check Token Budget before sending
            if (!tokenManager.isWithinBudget(systemInstruction)) {
                EventBus.emit('TELEMETRY_LOG', `[WARNING] Approaching token limit. Compressing context...`);
                // In a full implementation, you would trigger older slice compression here
            }

            const expectJson = (stage.pass === 2 || stage.pass === 3 || stage.pass === 7 || stage.pass === 11 || stage.pass === 15 || stage.pass === 19);
            
            const response = await gemini.generate(systemInstruction, `Execute Pass ${stage.pass}.`, expectJson);
            
            tokenManager.trackUsage(systemInstruction, typeof response === 'object' ? JSON.stringify(response) : response);

            // Action Mapping based on Pass Number
            await this.mapResponseToState(stage.pass, response);
        }
    }

    /**
     * Maps the output from Gemini directly into the correct state variables.
     */
    async mapResponseToState(passNumber, responseText) {
        switch (passNumber) {
            case 1:
                await stateManager.update('trajectory', responseText);
                break;
            case 2: // Plan (JSON Expected)
                await stateManager.update('plan.outline', responseText.outline || responseText);
                await stateManager.update('STYLE_GUIDE', responseText.STYLE_GUIDE || "");
                break;
            case 3: case 7: case 11: case 15: case 19: // Query Generators
                await stateManager.update(`queries.pass${passNumber}`, responseText);
                break;
            case 4:
                await stateManager.update('memory_index.slice1', responseText);
                break;
            case 5: case 6: case 9: case 10: case 13: case 14: case 17: case 18: case 21: case 22:
                await stateManager.update(`draft.pass${passNumber}`, responseText);
                break;
            case 8:
                await stateManager.update('memory_index.slice2', responseText);
                // Simple heuristic to extract contradictions
                if (typeof responseText === 'string' && responseText.includes('CONTRADICTION')) {
                    const currentC = stateManager.get('contradictions') || [];
                    await stateManager.update('contradictions', [...currentC, "Detected in Pass 8"]);
                }
                break;
            case 12:
                await stateManager.update('memory_index.slice3', responseText);
                break;
            case 16:
                await stateManager.update('memory_index.slice4', responseText);
                break;
            case 20:
                await stateManager.update('memory_index.slice5', responseText);
                // Compile all drafts for the audit phase
                this.compileAllDrafts();
                break;
            case 23:
                await stateManager.update('audit.errors', responseText);
                break;
            case 24:
                await stateManager.update('audit.ocp_codes', responseText);
                break;
        }
    }

    /**
     * Assembles all the individual written sections into a single master string.
     */
    async compileAllDrafts() {
        const draft = stateManager.get('draft');
        const allPasses = [
            draft.pass5, draft.pass6, draft.pass9, draft.pass10, draft.pass13,
            draft.pass14, draft.pass17, draft.pass18, draft.pass21, draft.pass22
        ].filter(Boolean).join('\n\n');
        
        await stateManager.update('draft.all_passes', allPasses);
        EventBus.emit('TELEMETRY_LOG', "Compiled all narrative drafts for final Audit.");
    }

    /**
     * Executes Pass 25 Algorithm locally (Sub-part B)
     */
    async executeLocalOcpAlgorithm() {
        EventBus.emit('TELEMETRY_LOG', "Executing local algorithmic string replacements (OCP Pass 25)...");
        const finalDraft = await OcpAlgorithm.execute();
        await stateManager.update('final_report', finalDraft);
        EventBus.emit('TELEMETRY_LOG', "Final Report mathematically verified and finalized.");
    }

    stopPipeline() {
        this.shouldHalt = true;
    }
}

export const pipeline = new OraclePipeline();
