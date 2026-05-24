// js/api/geminiStream.js
import { eventBus } from '../core/eventBus.js';

export class GeminiStreamer {
    
    // 1. NATIVE STREAMING: Used for Phase 3 (Generation) where we WANT the UI to update live.
    static async processStream(response) {
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
                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (textChunk) {
                        fullText += textChunk;
                        // Broadcasts the text to the UI to create the typing effect
                        eventBus.publish('LLM_CHUNK_RECEIVED', { text: textChunk });
                    }
                } catch (e) { 
                    // Silently ignore incomplete JSON chunks
                }
            }
        }
        return fullText;
    }

    // 2. SILENT STREAMING: Used for heavy backend passes (like Phase 12 Synthesis).
    // Bypasses Vercel's 30s timeout by actively receiving data, but hides it from the UI.
    static async processSilentStream(response) {
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
                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (textChunk) {
                        fullText += textChunk;
                        // CRITICAL DIFFERENCE: We do NOT publish to the eventBus here.
                        // The text accumulates secretly in the background.
                    }
                } catch (e) { 
                    // Silently ignore incomplete JSON chunks
                }
            }
        }
        return fullText;
    }
}
