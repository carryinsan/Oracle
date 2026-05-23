// js/api/groqClient.js
import { fetchWithRetry } from './geminiRetry.js';

// The unbreakable breather function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class GroqClient {
    constructor() {
        this.baseUrl = "/api/groq";
    }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        // STRICT 2.5s DELAY: Mathematically limits to 24 Requests Per Minute (safely under Groq's 30 RPM limit)
        await sleep(2500); 

        const payload = { promptText, systemInstruction, expectJson };

        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        
        const data = await response.json();
        const output = data.text || "";
        
        return expectJson ? this._parseStrictJson(output) : output;
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
            console.error("[GroqClient] JSON Parse Fallback Triggered. Raw Text:", rawText);
            return rawText.includes('[') ? [] : {}; 
        }
    }
}
