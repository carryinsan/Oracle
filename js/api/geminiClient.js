// js/api/geminiClient.js
import { fetchWithRetry } from './geminiRetry.js';
import { GeminiStreamer } from './geminiStream.js';

export class GeminiClient {
    constructor(apiKey) {
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
            let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // FIX: Hunt down actual JSON boundaries to ignore conversational garbage
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');
            
            if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            } else if (firstBracket !== -1 && lastBracket !== -1) {
                cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            }

            return JSON.parse(cleanText);
        } catch (error) {
            console.error("[GeminiClient] JSON Parse Fallback Triggered. Raw Text:", rawText);
            // FIX: Return an empty object/array instead of throwing a fatal error to prevent freezing
            return rawText.includes('[') ? [] : {}; 
        }
    }
}
