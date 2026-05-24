// js/api/openrouterClient.js
import { fetchWithRetry } from './geminiRetry.js';
import { eventBus } from '../core/eventBus.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class OpenRouterClient {
    constructor() { this.baseUrl = "/api/openrouter"; }

    async generateContent(promptText, systemInstruction = "", expectJson = false) {
        await sleep(3500); // 20 RPM Protection
        
        // SILENT STREAMING: Force stream to true to bypass Vercel 30s timeout
        const payload = { promptText, systemInstruction, expectJson, stream: true };
        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`OpenRouter API Error: ${response.status}`);
        
        // Secretly accumulate the chunks in the background
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                    const data = JSON.parse(dataStr);
                    const textChunk = data.choices?.[0]?.delta?.content || "";
                    if (textChunk) {
                        fullText += textChunk; 
                        // Intentionally NOT emitting to eventBus to keep UI clean
                    }
                } catch (e) { }
            }
        }
        return expectJson ? this._parseStrictJson(fullText) : fullText;
    }

    async streamContent(promptText, systemInstruction = "") {
        await sleep(3500); // 20 RPM Protection
        const payload = { promptText, systemInstruction, expectJson: false, stream: true };
        const response = await fetchWithRetry(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`OpenRouter Stream Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                    const data = JSON.parse(dataStr);
                    const textChunk = data.choices?.[0]?.delta?.content || "";
                    if (textChunk) {
                        fullText += textChunk;
                        eventBus.publish('LLM_CHUNK_RECEIVED', { text: textChunk }); // Normal UI Streaming
                    }
                } catch (e) { }
            }
        }
        return fullText;
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
