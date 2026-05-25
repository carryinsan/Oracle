/**
 * LexisAI Pagination & Chunk Stitcher
 * Path: /js/engine/responseCombiner.js
 */
import { openrouterClient } from '../api/openrouterClient.js';
import { eventBus } from '../core/eventBus.js';

export class ResponseCombiner {
    
    /**
     * Executes an LLM call and automatically handles pagination if the 
     * model truncates due to maximum output token limits.
     */
    static async generateContinuous(messages, maxContinuations = 2) {
        let fullResponse = "";
        let currentMessages = [...messages];
        let continuations = 0;

        while (continuations <= maxContinuations) {
            const data = await openrouterClient.generate(currentMessages);
            const text = data.choices[0]?.message?.content || "";
            const finishReason = data.choices[0]?.finish_reason;

            fullResponse += text;

            // If the model finished naturally, exit the loop
            if (finishReason === 'stop' || finishReason !== 'length') {
                break;
            }

            eventBus.emit('TERMINAL_LOG', { message: `[SYS] Max output tokens reached. Initiating seamless string continuation...` });
            
            // Append the assistant's partial response to the context
            currentMessages.push({ role: "assistant", content: text });
            // Command the model to continue exactly where it stopped without repeating itself
            currentMessages.push({ role: "user", content: "Continue writing exactly where you left off. Do not repeat the previous sentence or add conversational filler." });
            
            continuations++;
        }

        return this.cleanStitches(fullResponse);
    }

    /**
     * Cleans up overlapping markdown artifacts that can occur during continuation.
     */
    static cleanStitches(rawText) {
        // Remove trailing or orphaned markdown tables if they got cut in half
        let cleaned = rawText.replace(/(\n\|.*\|)+\s*$/, '');
        // Remove repetitive continuation artifacts if the LLM got confused
        cleaned = cleaned.replace(/As I was saying,/gi, '');
        cleaned = cleaned.replace(/Continuing from the previous section:/gi, '');
        
        return cleaned.trim();
    }
}
