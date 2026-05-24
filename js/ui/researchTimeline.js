// js/ui/researchTimeline.js
import { eventBus } from '../core/eventBus.js';

class ResearchTimeline {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    eventBus.subscribe('ROUTE_CHANGED', (data) => {
      if (data.path === '/research') {
        this.bindElements();
        this.renderInitialTimeline();
      }
    });

    eventBus.subscribe('PIPELINE_ACTION', (data) => {
      this.highlightByAction(data.action || '');
    });

    eventBus.subscribe('STAGE_CHANGED', (data) => {
      this.highlightByStage(data.stage || '');
    });
  }

  bindElements() {
    this.container = document.getElementById('timeline-container');
  }

  renderInitialTimeline() {
    if (!this.container) return;

    const phases = [
      'PHASE 1: DISCOVERY',
      'PHASE 1: EXTRACTION',
      'PHASE 1: REFLECTION',
      'PHASE 1: INDEXING',
      'PHASE 1: GAP-FILL',
      'PHASE 1: COMPRESSION',
      'PHASE 1: VERIFICATION',
      'PHASE 2: GLOBAL SYNTHESIS',
      'PHASE 2: OUTLINING',
      'PHASE 2: RED-TEAM CRITIQUE',
      'PHASE 3: GENERATION',
      'PHASE 3: CITATION RESOLUTION',
      'PHASE 4: SMOOTHING',
      'PHASE 4: INTEGRITY AUDIT',
      'PHASE 4: FINAL AUDIT',
    ];

    this.container.innerHTML = phases
      .map(
        (phase) => `
        <div class="timeline-node" data-phase="${phase}" style="
          margin-bottom: 1rem;
          color: var(--text-secondary);
          opacity: 0.5;
          transition: all 0.3s ease;
        ">
          <span style="
            display:inline-block;
            width:8px;
            height:8px;
            border-radius:50%;
            background:currentColor;
            margin-right:8px;
          "></span>
          ${phase}
        </div>
      `
      )
      .join('');
  }

  highlightByStage(stageText) {
    if (!this.container || !stageText) return;

    const nodes = this.container.querySelectorAll('.timeline-node');
    const normalized = stageText.toUpperCase();

    let targetPhase = null;
    if (normalized.includes('DISCOVERY')) targetPhase = 'PHASE 1: DISCOVERY';
    else if (normalized.includes('EXTRACTION')) targetPhase = 'PHASE 1: EXTRACTION';
    else if (normalized.includes('REFLECTION')) targetPhase = 'PHASE 1: REFLECTION';
    else if (normalized.includes('INDEXING')) targetPhase = 'PHASE 1: INDEXING';
    else if (normalized.includes('GAP-FILL')) targetPhase = 'PHASE 1: GAP-FILL';
    else if (normalized.includes('COMPRESSION')) targetPhase = 'PHASE 1: COMPRESSION';
    else if (normalized.includes('VERIFICATION')) targetPhase = 'PHASE 1: VERIFICATION';
    else if (normalized.includes('GLOBAL SYNTHESIS')) targetPhase = 'PHASE 2: GLOBAL SYNTHESIS';
    else if (normalized.includes('OUTLINING')) targetPhase = 'PHASE 2: OUTLINING';
    else if (normalized.includes('RED-TEAM')) targetPhase = 'PHASE 2: RED-TEAM CRITIQUE';
    else if (normalized.includes('GENERATION')) targetPhase = 'PHASE 3: GENERATION';
    else if (normalized.includes('CITATION')) targetPhase = 'PHASE 3: CITATION RESOLUTION';
    else if (normalized.includes('SMOOTHING')) targetPhase = 'PHASE 4: SMOOTHING';
    else if (normalized.includes('INTEGRITY')) targetPhase = 'PHASE 4: INTEGRITY AUDIT';
    else if (normalized.includes('FINAL AUDIT')) targetPhase = 'PHASE 4: FINAL AUDIT';

    if (targetPhase) this.applyHighlight(nodes, targetPhase);
  }

  highlightByAction(actionText) {
    if (!this.container || !actionText) return;

    const normalized = actionText.toUpperCase();
    const nodes = this.container.querySelectorAll('.timeline-node');

    if (normalized.includes('SEARCH') || normalized.includes('DISCOVERY')) {
      this.applyHighlight(nodes, 'PHASE 1: DISCOVERY');
    } else if (normalized.includes('EXTRACT')) {
      this.applyHighlight(nodes, 'PHASE 1: EXTRACTION');
    } else if (normalized.includes('SYNTHESIS')) {
      this.applyHighlight(nodes, 'PHASE 2: GLOBAL SYNTHESIS');
    } else if (normalized.includes('OUTLINE')) {
      this.applyHighlight(nodes, 'PHASE 2: OUTLINING');
    } else if (normalized.includes('GENERAT')) {
      this.applyHighlight(nodes, 'PHASE 3: GENERATION');
    } else if (normalized.includes('CITATION')) {
      this.applyHighlight(nodes, 'PHASE 3: CITATION RESOLUTION');
    } else if (normalized.includes('SMOOTH')) {
      this.applyHighlight(nodes, 'PHASE 4: SMOOTHING');
    } else if (normalized.includes('AUDIT')) {
      this.applyHighlight(nodes, 'PHASE 4: FINAL AUDIT');
    }
  }

  applyHighlight(nodes, targetPhase) {
    nodes.forEach((node) => {
      if (node.dataset.phase === targetPhase) {
        node.style.color = 'var(--glow-accent)';
        node.style.opacity = '1';
        node.style.fontWeight = 'bold';
      } else {
        node.style.color = 'var(--text-secondary)';
        node.style.opacity = '0.5';
        node.style.fontWeight = 'normal';
      }
    });
  }
}

export const researchTimeline = new ResearchTimeline();
