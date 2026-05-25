/**
 * LexisAI UI Bootstrapper
 * Path: /js/ui/thinkingVisualization.js
 */
import { eventBus } from '../core/eventBus.js';
import { ResearchFeed } from './researchFeed.js';
import { ResearchProgress } from './researchProgress.js';
import { SourceExplorer } from './sourceExplorer.js';
import { ReportViewer } from './reportViewer.js';
import { ResearchTimeline } from './researchTimeline.js'; // [FIX APPLIED]

class UIManager {
    constructor() {
        this.activeControllers = [];
        // Keep ReportViewer alive globally because it bridges routes
        this.reportViewer = new ReportViewer(); 
        
        eventBus.on('DOM_READY', (payload) => {
            if (payload.route === '#/research') {
                this.activeControllers.push(new ResearchFeed());
                this.activeControllers.push(new ResearchProgress());
                this.activeControllers.push(new SourceExplorer());
                this.activeControllers.push(new ResearchTimeline()); // [FIX APPLIED]
                
                // Trigger the engine to start if there is a pending intent in session memory
                const intent = sessionStorage.getItem('LEXIS_INTENT');
                if (intent) {
                    sessionStorage.removeItem('LEXIS_INTENT');
                    import('../engine/oraclePipeline.js').then(module => {
                        module.oracle.execute(intent);
                    });
                }
            }
        });
    }
}

// Initialize the UI Manager
window.LexisUIManager = new UIManager();
