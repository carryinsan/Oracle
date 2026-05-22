// js/api/geminiStream.js
import { eventBus } from '../core/eventBus.js';

export class GeminiStreamer {
    static async processStream(response) {
        if (!response.body) throw new Error("Response body is not readable.");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    eventBus.publish('LLM_STREAM_COMPLETE', { status: 'success' });
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                
                // Gemini API SSE chunks usually start with "data: "
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '').trim();
                        if (jsonStr === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(jsonStr);
                            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                            if (textChunk) {
                                eventBus.publish('LLM_CHUNK_RECEIVED', { text: textChunk });
                            }
                        } catch (e) {
                            // Ignore partial JSON parses in the middle of a stream chunk
                        }
                    }
                }
            }
        } catch (error) {
            console.error("[GeminiStream] Error reading stream:", error);
            eventBus.publish('LLM_STREAM_ERROR', { error: error.message });
            throw error;
        }
    }
}
