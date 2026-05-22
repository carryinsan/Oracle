// js/ui/thinkingVisualization.js
import { eventBus } from '../core/eventBus.js';

class ThinkingVisualization {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrame = null;
        this.isActive = false;
        
        this.init();
    }

    init() {
        eventBus.subscribe('ROUTE_CHANGED', (data) => {
            if (data.path === '/research') {
                setTimeout(() => this.setupCanvas(), 100);
            } else {
                this.stopAnimation();
            }
        });

        eventBus.subscribe('PIPELINE_COMPLETE', () => this.stopAnimation());
        eventBus.subscribe('PIPELINE_ERROR', () => this.stopAnimation());
    }

    setupCanvas() {
        this.canvas = document.getElementById('ambient-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.createParticles();
        this.isActive = true;
        this.animate();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }

    animate() {
        if (!this.isActive || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    stopAnimation() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export const thinkingVisualization = new ThinkingVisualization();
