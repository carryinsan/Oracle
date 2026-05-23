// js/api/tavilyCompressor.js

export class TavilyCompressor {
    static compressHTML(rawContent) {
        if (!rawContent) return "";

        try {
            let parser = new DOMParser();
            let doc = parser.parseFromString(rawContent, 'text/html');

            const selectorsToRemove = [
                'script', 'style', 'nav', 'footer', 'header', 
                'aside', 'noscript', 'iframe', 'svg', 'form', 'button'
            ];

            selectorsToRemove.forEach(selector => {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            const textContent = doc.body ? doc.body.textContent : rawContent;
            let cleanText = textContent.replace(/\s+/g, ' ').trim();
            
            // CRITICAL RAM FIX: Cap each source to 8,000 characters to prevent 
            // Vercel 413 Payload Too Large errors when sending 270 sources to Gemini.
            cleanText = cleanText.substring(0, 8000);

            // AGGRESSIVE GARBAGE COLLECTION: Free up RAM instantly
            parser = null;
            doc = null;

            return cleanText;

        } catch (error) {
            return rawContent.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 8000);
        }
    }

    static processSearchResults(apiResponse) {
        if (!apiResponse || !apiResponse.results) return [];

        return apiResponse.results.map(result => ({
            title: result.title,
            url: result.url,
            score: result.score,
            content: this.compressHTML(result.raw_content || result.content)
        }));
    }
}
