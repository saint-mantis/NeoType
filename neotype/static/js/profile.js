// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.currentPeriod = 'all';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCharts();
        this.updateStatsForPeriod(this.currentPeriod);
    }
    
    setupEventListeners() {
        // Period selector buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPeriod(e.target.dataset.period);
            });
        });
    }
    
    selectPeriod(period) {
        if (this.currentPeriod === period) return;
        
        // Update UI
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Update data
        this.currentPeriod = period;
        this.updateStatsForPeriod(period);
    }
    
    updateStatsForPeriod(period) {
        // This would typically make an API call to get stats for the selected period
        // For now, we'll use the existing data
        console.log(`Loading stats for period: ${period}`);
    }
    
    loadCharts() {
        // Initialize charts (placeholder for now)
        this.createProgressChart();
        this.createAccuracyChart();
    }
    
    createProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple placeholder chart
        ctx.fillStyle = 'var(--color-text-secondary)';
        ctx.font = '16px var(--font-body)';
        ctx.textAlign = 'center';
        ctx.fillText('Progress chart coming soon!', canvas.width / 2, canvas.height / 2);
    }
    
    createAccuracyChart() {
        const canvas = document.getElementById('accuracy-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple placeholder chart
        ctx.fillStyle = 'var(--color-text-secondary)';
        ctx.font = '16px var(--font-body)';
        ctx.textAlign = 'center';
        ctx.fillText('Accuracy chart coming soon!', canvas.width / 2, canvas.height / 2);
    }
}

// Test details modal functionality
window.viewTestDetails = function(testId) {
    const modal = document.getElementById('test-details-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    // Placeholder content
    modalBody.innerHTML = `
        <div class="test-detail">
            <h4>Test #${testId}</h4>
            <p>Detailed test analysis coming soon!</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
};

window.closeModal = function() {
    const modal = document.getElementById('test-details-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
    
    // Handle modal close on background click
    const modal = document.getElementById('test-details-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.closeModal();
            }
        });
    }
});

// Export for global use
window.ProfileManager = ProfileManager;