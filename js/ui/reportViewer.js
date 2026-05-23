// js/ui/reportViewer.js
import { eventBus } from '../core/eventBus.js';
import { researchState } from '../engine/researchState.js';

class ReportViewer {
    constructor() {
        this.init();
    }

    init() {
        eventBus.subscribe('PIPELINE_COMPLETE', () => this.renderReport());
    }

    renderReport() {
        const report = researchState.get('sections.final_assembly');
        const sources = [...new Set(researchState.get('anchored_claims').map(c => c.url))];
        const container = document.getElementById('report-content-container');
        
        container.innerHTML = `
            <div id="report-body" style="padding: 20px;">${report}</div>
            
            <div id="premium-source-bar" class="frosted-glass" style="margin-top: 40px; padding: 20px;">
                <h3 style="color: var(--glow-accent);">RESEARCHING ${sources.length} SOURCES</h3>
                <div id="source-list" style="margin-top: 15px; max-height: 300px; overflow-y: auto;">
                    ${sources.map((url, i) => `
                        <div class="frosted-glass" style="padding: 10px; margin-bottom: 8px; border-radius: 8px; font-size: 0.85rem;">
                            <span style="color: var(--text-secondary);">[${i + 1}]</span> 
                            <a href="${url}" target="_blank" style="color: var(--text-primary); text-decoration: none;">${url}</a>
                        </div>
                    `).join('')}
                </div>
                <button id="pdf-export-btn" style="width: 100%; margin-top: 20px; padding: 15px; background: var(--glow-accent); border: none; border-radius: 8px; color: white; cursor: pointer;">
                    Download Full Report (PDF)
                </button>
            </div>
        `;

        document.getElementById('pdf-export-btn').addEventListener('click', () => this.exportPDF());
    }

    exportPDF() {
        const element = document.getElementById('report-body');
        const opt = {
            margin: 1,
            filename: 'LexisAI_Research_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        // Ensure html2pdf is loaded via CDN in index.html
        html2pdf().set(opt).from(element).save();
    }
}

export const reportViewer = new ReportViewer();
