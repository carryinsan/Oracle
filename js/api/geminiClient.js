// js/api/geminiClient.js
import { fetchWithRetry } from './geminiRetry.js';
import { GeminiStreamer } from './geminiStream.js';

export class GeminiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash";
    }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        const url = `${this.baseUrl}:generateContent?key=${this.apiKey}`;
        const payload = this._buildPayload(promptText, systemInstruction, expectJson);

        const response = await fetchWithRetry(url, {
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
        const url = `${this.baseUrl}:streamGenerateContent?key=${this.apiKey}`;
        const payload = this._buildPayload(promptText, systemInstruction, false);

        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Stream API Error: ${response.status}`);
        
        // FIX: Return the awaited text so state isn't lost
        return await GeminiStreamer.processStream(response); 
    }

    _buildPayload(promptText, systemInstruction, expectJson) {
        const payload = {
            contents: [{ parts: [{ text: promptText }] }]
        };
        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        if (expectJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
        }
        return payload;
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
