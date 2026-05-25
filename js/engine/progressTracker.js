/**
 * LexisAI Deterministic Progress & Telemetry Tracker
 * Path: /js/engine/progressTracker.js
 */
import { eventBus } from '../core/eventBus.js';

export class ProgressTracker {
    static TOTAL_PASSES = 40; // 25 AI + 15 Search
    static currentPass = 0;

    static reset() {
        this.currentPass = 0;
        this.emitUpdate("Pipeline Initialized", 0);
    }

    static advance(passName, increment = 1) {
        this.currentPass += increment;
        
        // Failsafe: Never exceed 100% visually
        const rawPercentage = (this.currentPass / this.TOTAL_PASSES) * 100;
        const safePercentage = Math.min(Math.round(rawPercentage), 100);

        this.emitUpdate(passName, safePercentage);
    }

    static emitUpdate(actionLabel, percentage) {
        eventBus.emit('PROGRESS_UPDATE', { 
            pass: this.currentPass,
            total: this.TOTAL_PASSES,
            action: actionLabel, 
            percentage: percentage 
        });

        // Feed the cinematic terminal
        eventBus.emit('TERMINAL_LOG', { message: `[SYS] ${actionLabel}` });
    }
}
