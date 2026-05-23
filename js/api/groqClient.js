// js/api/groqClient.js
import { fetchWithRetry } from './geminiRetry.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class GroqClient {
    constructor() { this.baseUrl = "/api/groq"; }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        await sleep(2500); // 30 RPM Protection
        const payload = { promptText, systemInstruction, expectJson, stream: false };
        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content || "";
        return expectJson ? this._parseStrictJson(output) : output;
    }

    _parseStrictJson(rawText) {
        try {
            let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const start = cleanText.indexOf('{');
            const end = cleanText.lastIndexOf('}');
            const arrStart = cleanText.indexOf('[');
            const arrEnd = cleanText.lastIndexOf(']');
            if (start !== -1 && end !== -1 && (arrStart === -1 || start < arrStart)) cleanText = cleanText.substring(start, end + 1);
            else if (arrStart !== -1 && arrEnd !== -1) cleanText = cleanText.substring(arrStart, arrEnd + 1);
            return JSON.parse(cleanText);
        } catch (e) { return rawText.includes('[') ? [] : {}; }
    }
}
