// Celebration Animations for Personal Records
class CelebrationManager {
    constructor() {
        this.confettiCanvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrame = null;
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.confettiCanvas = document.getElementById('confetti-canvas');
        
        if (!this.confettiCanvas) {
            // Create canvas if it doesn't exist
            this.confettiCanvas = document.createElement('canvas');
            this.confettiCanvas.id = 'confetti-canvas';
            this.confettiCanvas.className = 'confetti-canvas';
            this.confettiCanvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
            `;
            document.body.appendChild(this.confettiCanvas);
        }
        
        this.ctx = this.confettiCanvas.getContext('2d');
        this.resizeCanvas();
    }
    
    setupEventListeners() {
        // Resize canvas on window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Listen for typing engine events
        document.addEventListener('personalRecord', (e) => {
            this.triggerCelebration(e.detail);
        });
        
        // Cleanup when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAllAnimations();
            }
        });
    }
    
    resizeCanvas() {
        if (this.confettiCanvas) {
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
        }
    }
    
    triggerCelebration(recordData) {
        // Don't start new celebration if one is already active
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Screen flash effect
        this.screenFlash();
        
        // Confetti explosion
        this.createConfetti();
        
        // Achievement modal
        this.showAchievementModal(recordData);
        
        // Stats count-up animation
        this.animateStats(recordData);
        
        // Haptic feedback on mobile
        this.triggerHapticFeedback();
        
        // Play celebration sound (if enabled)
        this.playCelebrationSound();
        
        // Auto-cleanup after animation
        setTimeout(() => {
            this.isActive = false;
        }, 5000);
    }
    
    screenFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, 
                rgba(59, 130, 246, 0.3), 
                rgba(16, 185, 129, 0.3), 
                rgba(245, 158, 11, 0.3));
            pointer-events: none;
            z-index: 9997;
            animation: flash-fade 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        
        // Remove flash element after animation
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 800);
    }
    
    createConfetti() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
        ];
        
        const particleCount = this.getParticleCount();
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 15,
                vy: Math.random() * -15 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                gravity: 0.5,
                friction: 0.99,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                fadeRate: 0.02,
                shape: Math.random() > 0.5 ? 'circle' : 'square'
            });
        }
        
        this.animateConfetti();
    }
    
    getParticleCount() {
        // Adjust particle count based on device performance
        if (window.innerWidth < 768) return 30; // Mobile
        if (window.innerWidth < 1024) return 50; // Tablet
        return 80; // Desktop
    }
    
    animateConfetti() {
        if (!this.ctx || this.particles.length === 0) {
            this.stopConfetti();
            return;
        }
        
        this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update physics
            particle.vy += particle.gravity;
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            particle.rotation += particle.rotationSpeed;
            particle.opacity -= particle.fadeRate;
            
            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate((particle.rotation * Math.PI) / 180);
            
            this.ctx.fillStyle = particle.color;
            
            if (particle.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            }
            
            this.ctx.restore();
            
            // Remove particles that are off-screen or faded
            if (particle.y > window.innerHeight + 100 || 
                particle.opacity <= 0 ||
                particle.x < -100 || 
                particle.x > window.innerWidth + 100) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animateConfetti());
        } else {
            this.stopConfetti();
        }
    }
    
    stopConfetti() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.particles = [];
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        }
    }
    
    showAchievementModal(recordData) {
        const modal = document.getElementById('achievement-modal');
        if (!modal) return;
        
        // Update modal content
        const title = modal.querySelector('#achievement-title');
        const wpmElement = modal.querySelector('#achievement-wpm');
        const accuracyElement = modal.querySelector('#achievement-accuracy');
        
        if (title) {
            const achievements = [
                '🎉 New Personal Record!',
                '🚀 Amazing Progress!',
                '⭐ Outstanding Performance!',
                '🏆 Record Broken!',
                '💪 Level Up!'
            ];
            title.textContent = achievements[Math.floor(Math.random() * achievements.length)];
        }
        
        if (wpmElement) {
            this.animateNumber(wpmElement, 0, recordData.wpm, 1000);
        }
        
        if (accuracyElement) {
            this.animateNumber(accuracyElement, 0, recordData.accuracy, 1000, '%');
        }
        
        // Show modal with animation
        modal.classList.remove('hidden');
        modal.style.animation = 'celebration-bounce 0.6s ease-out';
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.closeAchievementModal();
        }, 4000);
    }
    
    closeAchievementModal() {
        const modal = document.getElementById('achievement-modal');
        if (modal) {
            modal.style.animation = 'celebration-fade-out 0.3s ease-out';
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.animation = '';
            }, 300);
        }
    }
    
    animateStats(recordData) {
        // Animate the live stats to show the achievement
        const statsElements = {
            'wpm-display': recordData.wpm,
            'accuracy-display': recordData.accuracy
        };
        
        Object.entries(statsElements).forEach(([elementId, targetValue]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.animation = 'celebration-pulse 0.8s ease-out';
                
                setTimeout(() => {
                    element.style.animation = '';
                }, 800);
            }
        });
    }
    
    animateNumber(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        const range = end - start;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (range * easeOut);
            
            element.textContent = Math.round(current) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    triggerHapticFeedback() {
        if (navigator.vibrate) {
            // Celebration pattern: short-long-short-long
            navigator.vibrate([100, 50, 200, 50, 100]);
        }
    }
    
    playCelebrationSound() {
        // Only play if user has interacted with the page and audio is enabled
        if (this.shouldPlaySound()) {
            this.playTone(523.25, 0.2); // C5
            setTimeout(() => this.playTone(659.25, 0.2), 200); // E5
            setTimeout(() => this.playTone(783.99, 0.4), 400); // G5
        }
    }
    
    shouldPlaySound() {
        // Check if audio is enabled in user preferences
        try {
            const audioEnabled = localStorage.getItem('neotype_audio_enabled');
            return audioEnabled !== 'false';
        } catch (e) {
            return false; // Default to no sound if can't access localStorage
        }
    }
    
    playTone(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
            // Clean up
            setTimeout(() => {
                oscillator.disconnect();
                gainNode.disconnect();
            }, duration * 1000 + 100);
            
        } catch (e) {
            // Audio not supported or blocked
            console.log('Audio playback not available');
        }
    }
    
    // Fireworks effect for special achievements
    createFireworks() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffeaa7'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 3;
        
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const velocity = 5 + Math.random() * 3;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2,
                gravity: 0.1,
                friction: 0.98,
                life: 1.0,
                decay: 0.02,
                trail: []
            });
        }
        
        this.animateFireworks();
    }
    
    animateFireworks() {
        if (!this.ctx || this.particles.length === 0) return;
        
        this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Store position for trail
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > 10) {
                particle.trail.shift();
            }
            
            // Update physics
            particle.vy += particle.gravity;
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            // Draw trail
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = particle.size;
            this.ctx.globalAlpha = particle.life * 0.5;
            this.ctx.beginPath();
            
            for (let j = 0; j < particle.trail.length; j++) {
                const point = particle.trail[j];
                if (j === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
            
            // Draw particle
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animateFireworks());
        }
    }
    
    // Stop all animations
    stopAllAnimations() {
        this.stopConfetti();
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.particles = [];
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        }
    }
    
    // Public API
    celebrate(type = 'record', data = {}) {
        switch (type) {
            case 'record':
                this.triggerCelebration(data);
                break;
            case 'fireworks':
                this.createFireworks();
                break;
            case 'confetti':
                this.createConfetti();
                break;
        }
    }
    
    // Settings
    setAudioEnabled(enabled) {
        try {
            localStorage.setItem('neotype_audio_enabled', enabled.toString());
        } catch (e) {
            console.warn('Could not save audio preference');
        }
    }
    
    isAudioEnabled() {
        return this.shouldPlaySound();
    }
}

// Add CSS animations
const celebrationStyles = `
    @keyframes celebration-bounce {
        0% { transform: scale(0.3) translateY(100px); opacity: 0; }
        50% { transform: scale(1.1) translateY(-10px); opacity: 1; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    
    @keyframes celebration-fade-out {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0; }
    }
    
    @keyframes celebration-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    @keyframes flash-fade {
        0% { opacity: 0; }
        20% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    .confetti-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
    }
    
    .achievement-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
    }
    
    .achievement-content {
        background: var(--color-bg-secondary);
        border-radius: var(--radius-xl);
        padding: var(--space-2xl);
        text-align: center;
        max-width: 400px;
        width: 90%;
        border: 2px solid var(--color-accent);
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
    }
    
    .achievement-content h2 {
        font-size: 1.5rem;
        margin-bottom: var(--space-lg);
        color: var(--color-text-primary);
    }
    
    .achievement-stats {
        display: flex;
        justify-content: space-around;
        margin: var(--space-lg) 0;
    }
    
    .achievement-stat {
        text-align: center;
    }
    
    .achievement-stat .label {
        display: block;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin-bottom: var(--space-xs);
    }
    
    .achievement-stat .value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-accent);
        font-family: var(--font-mono);
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = celebrationStyles;
    document.head.appendChild(styleSheet);
}

// Initialize celebration manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.celebrationManager = new CelebrationManager();
    
    // Setup close button for achievement modal
    const closeBtn = document.querySelector('#achievement-modal .btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.celebrationManager.closeAchievementModal();
        });
    }
    
    // Close modal on background click
    const modal = document.getElementById('achievement-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.celebrationManager.closeAchievementModal();
            }
        });
    }
});

// Global close function
window.closeAchievementModal = function() {
    if (window.celebrationManager) {
        window.celebrationManager.closeAchievementModal();
    }
};

// Export for global use
window.CelebrationManager = CelebrationManager;