// js/api/geminiClient.js
import { fetchWithRetry } from './geminiRetry.js';
import { GeminiStreamer } from './geminiStream.js';

export class GeminiClient {
    constructor(apiKey) {
        // apiKey is ignored. Pointing strictly to local Vercel backend.
        this.baseUrl = "/api/gemini";
    }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        const payload = { promptText, systemInstruction, expectJson, stream: false };

        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        return expectJson ? this._parseStrictJson(output) : output;
    }

    async streamContent(promptText, systemInstruction = "") {
        const payload = { promptText, systemInstruction, expectJson: false, stream: true };

        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Stream API Error: ${response.status}`);
        
        return await GeminiStreamer.processStream(response); 
    }

    _parseStrictJson(rawText) {
        try {
            const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            throw new Error("Failed to parse deterministic JSON from LLM.");
        }
    }
}
