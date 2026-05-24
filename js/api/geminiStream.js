// js/api/geminiStream.js
import { eventBus } from '../core/eventBus.js';

export class GeminiStreamer {
    
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
                        eventBus.publish('LLM_CHUNK_RECEIVED', { text: textChunk });
                    }
                } catch (e) { }
            }
        }
        return fullText;
    }

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
                    }
                } catch (e) { }
            }
        }
        return fullText;
    }
}
