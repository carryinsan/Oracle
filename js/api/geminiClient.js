// File Path: js/api/geminiClient.js
// Purpose: Interfaces with the Gemini 2.5 Flash model. Formats prompts and strictly parses responses.

import { Config } from '../core/config.js';
import { ResilienceEngine } from './geminiRetry.js';

export class GeminiClient {
    constructor() {
        this.endpoint = Config.ENDPOINTS.GEMINI;
    }

    /**
     * Sends a generation request to the Gemini API.
     * @param {string} systemInstruction - The Oracle system prompt for the current pass.
     * @param {string} promptText - The user query or aggregated context.
     * @param {boolean} expectJson - Whether the model should strictly return JSON.
     * @returns {Promise<string|object>}
     */
    async generate(systemInstruction, promptText, expectJson = false) {
        const operation = async () => {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    systemInstruction,
                    promptText,
                    expectJson,
                    model: 'gemini-2.5-flash'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Validate payload structure mathematically, preventing mid-object severance
            if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error("Malformed response schema from Gemini API.");
            }

            const textOutput = data.candidates[0].content.parts[0].text;

            if (expectJson) {
                try {
                    // Strip potential markdown code blocks surrounding JSON
                    const cleanedStr = textOutput.replace(/```json\n?|```/g, '').trim();
                    return JSON.parse(cleanedStr);
                } catch (e) {
                    console.error("[GeminiClient] JSON Parse Failure. Falling back to recovery.", textOutput);
                    throw new Error("JSON Parse Error: Output was not valid JSON.");
                }
            }

            return textOutput;
        };

        return await ResilienceEngine.executeWithRetry(operation);
    }
}

export const gemini = new GeminiClient();
