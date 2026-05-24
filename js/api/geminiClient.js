// js/api/geminiClient.js
import { fetchWithRetry } from './geminiRetry.js';
import { GeminiStreamer } from './geminiStream.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiClient {
    constructor() {
        this.baseUrl = "/api/gemini";
    }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        await sleep(5500); 

        const payload = { promptText, systemInstruction, expectJson, stream: true };
        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const fullText = await GeminiStreamer.processSilentStream(response);
        return expectJson ? this._parseStrictJson(fullText) : fullText;
    }

    async streamContent(promptText, systemInstruction = "") {
        await sleep(5500); 
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
            return rawText.includes('[') ? [] : {}; 
        }
    }
}
