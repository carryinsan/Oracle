// js/api/tavilyCompressor.js

export class TavilyCompressor {
    static compressHTML(rawContent) {
        if (!rawContent) return "";

        try {
            let parser = new DOMParser();
            let doc = parser.parseFromString(rawContent, 'text/html');

            const selectorsToRemove = [
                'script', 'style', 'nav', 'footer', 'header', 
                'aside', 'noscript', 'iframe', 'svg', 'form', 'button',
                '.ad', '.advertisement', '.menu', '#comments'
            ];

            selectorsToRemove.forEach(selector => {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            const textContent = doc.body ? doc.body.textContent : rawContent;
            let cleanText = textContent.replace(/\s+/g, ' ').trim();
            
            // TPM WALL FIX: Truncate to 1,200 characters (approx. 3 paragraphs).
            // This captures the Abstract/Core Facts while dropping the fluff.
            // 270 sources * 1200 chars = 324,000 chars (Safe for Gemini TPM limits).
            cleanText = cleanText.substring(0, 1200);

            // Instant Garbage Collection
            parser = null;
            doc = null;

            return cleanText;

        } catch (error) {
            return rawContent.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 1200);
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
