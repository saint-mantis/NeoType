// Client-side Leaderboard System with Local Caching
class Leaderboard {
    constructor(options = {}) {
        this.userId = options.userId;
        this.isAuthenticated = options.isAuthenticated;
        this.currentCategory = 'wpm';
        this.currentPeriod = 'all';
        this.currentPage = 1;
        this.pageSize = 20;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.searchQuery = '';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLeaderboard();
        this.loadUserRank();
        this.loadGlobalStats();
        this.startPeriodicRefresh();
    }
    
    setupEventListeners() {
        // Category selection
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.target.dataset.category);
            });
        });
        
        // Period selection
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPeriod(e.target.dataset.period);
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('search-users');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadLeaderboard();
                }, 300);
            });
        }
    }
    
    selectCategory(category) {
        if (this.currentCategory === category) return;
        
        // Update UI
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Update state and reload
        this.currentCategory = category;
        this.currentPage = 1;
        this.loadLeaderboard();
        this.loadUserRank();
    }
    
    selectPeriod(period) {
        if (this.currentPeriod === period) return;
        
        // Update UI
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Update state and reload
        this.currentPeriod = period;
        this.currentPage = 1;
        this.loadLeaderboard();
        this.loadUserRank();
    }
    
    async loadLeaderboard() {
        const cacheKey = `leaderboard_${this.currentCategory}_${this.currentPeriod}_${this.currentPage}_${this.searchQuery}`;
        
        // Check cache first
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            this.displayLeaderboard(cachedData);
            return;
        }
        
        // Show loading state
        this.showLoadingState();
        
        try {
            const response = await fetch(`/api/leaderboard/?category=${this.currentCategory}&period=${this.currentPeriod}&page=${this.currentPage}&search=${encodeURIComponent(this.searchQuery)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            
            const data = await response.json();
            
            // Cache the data
            this.setCache(cacheKey, data);
            
            // Display the data
            this.displayLeaderboard(data);
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showErrorState('Failed to load leaderboard');
        }
    }
    
    displayLeaderboard(data) {
        // Update podium
        this.updatePodium(data.top3 || []);
        
        // Update table
        this.updateTable(data.results || []);
        
        // Update pagination
        this.updatePagination(data.total_pages || 1, data.current_page || 1);
    }
    
    updatePodium(top3) {
        const positions = [1, 2, 3];
        
        positions.forEach(pos => {
            const podiumElement = document.getElementById(`podium-${pos}`);
            const user = top3[pos - 1];
            
            if (user) {
                const avatar = podiumElement.querySelector('.podium-avatar');
                const username = podiumElement.querySelector('.podium-username');
                const score = podiumElement.querySelector('.podium-score');
                
                avatar.textContent = user.username.charAt(0).toUpperCase();
                username.textContent = user.username;
                score.textContent = this.formatScore(user[this.currentCategory]);
                
                podiumElement.style.opacity = '1';
                podiumElement.onclick = () => this.showUserDetails(user);
            } else {
                podiumElement.style.opacity = '0.3';
                podiumElement.onclick = null;
                
                const username = podiumElement.querySelector('.podium-username');
                const score = podiumElement.querySelector('.podium-score');
                username.textContent = '--';
                score.textContent = '--';
            }
        });
    }
    
    updateTable(results) {
        const tableBody = document.getElementById('leaderboard-list');
        
        if (results.length === 0) {
            tableBody.innerHTML = `
                <div class="no-results">
                    <p>No users found${this.searchQuery ? ` for "${this.searchQuery}"` : ''}.</p>
                </div>
            `;
            return;
        }
        
        tableBody.innerHTML = results.map((user, index) => {
            const rank = ((this.currentPage - 1) * this.pageSize) + index + 1;
            const isCurrentUser = this.isAuthenticated && user.id === this.userId;
            
            return `
                <div class="table-row ${isCurrentUser ? 'current-user' : ''}" onclick="leaderboard.showUserDetails(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                    <div class="row-rank">
                        <span class="rank-number">${rank}</span>
                        ${this.getRankBadge(rank)}
                    </div>
                    <div class="row-user">
                        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="username">${user.username} ${isCurrentUser ? '(You)' : ''}</div>
                            <div class="user-stats-mini">${user.tests_completed} tests</div>
                        </div>
                    </div>
                    <div class="row-score">${this.formatScore(user[this.currentCategory])}</div>
                    <div class="row-tests">${user.tests_completed}</div>
                    <div class="row-accuracy">${user.avg_accuracy ? user.avg_accuracy.toFixed(1) + '%' : '--'}</div>
                    <div class="row-last-active">${this.formatDate(user.last_test_date)}</div>
                </div>
            `;
        }).join('');
    }
    
    updatePagination(totalPages, currentPage) {
        this.currentPage = currentPage;
        
        document.getElementById('current-page').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    getRankBadge(rank) {
        if (rank === 1) return '<span class="rank-badge gold">👑</span>';
        if (rank === 2) return '<span class="rank-badge silver">🥈</span>';
        if (rank === 3) return '<span class="rank-badge bronze">🥉</span>';
        if (rank <= 10) return '<span class="rank-badge top10">⭐</span>';
        return '';
    }
    
    formatScore(value) {
        if (!value) return '--';
        
        switch (this.currentCategory) {
            case 'wpm':
                return Math.round(value) + ' WPM';
            case 'accuracy':
                return value.toFixed(1) + '%';
            case 'consistency':
                return value.toFixed(1) + '%';
            default:
                return value.toString();
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    async loadUserRank() {
        if (!this.isAuthenticated) return;
        
        const cacheKey = `user_rank_${this.currentCategory}_${this.currentPeriod}`;
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
            this.displayUserRank(cachedData);
            return;
        }
        
        try {
            const response = await fetch(`/api/user-rank/?category=${this.currentCategory}&period=${this.currentPeriod}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user rank');
            }
            
            const data = await response.json();
            
            this.setCache(cacheKey, data);
            this.displayUserRank(data);
            
        } catch (error) {
            console.error('Error loading user rank:', error);
        }
    }
    
    displayUserRank(data) {
        document.getElementById('user-rank').textContent = data.rank ? `#${data.rank}` : 'Unranked';
        document.getElementById('user-wpm').textContent = data.wpm ? Math.round(data.wpm) : '--';
        document.getElementById('user-accuracy').textContent = data.accuracy ? data.accuracy.toFixed(1) + '%' : '--%';
        document.getElementById('user-tests').textContent = data.tests_completed || '--';
    }
    
    async loadGlobalStats() {
        const cacheKey = 'global_stats';
        const cachedData = this.getFromCache(cacheKey);
        
        if (cachedData) {
            this.displayGlobalStats(cachedData);
            return;
        }
        
        try {
            const response = await fetch('/api/global-stats/');
            
            if (!response.ok) {
                throw new Error('Failed to fetch global stats');
            }
            
            const data = await response.json();
            
            this.setCache(cacheKey, data);
            this.displayGlobalStats(data);
            
        } catch (error) {
            console.error('Error loading global stats:', error);
        }
    }
    
    displayGlobalStats(data) {
        document.getElementById('total-users').textContent = data.total_users || 0;
        document.getElementById('total-tests').textContent = data.total_tests || 0;
        document.getElementById('highest-wpm').textContent = data.highest_wpm ? Math.round(data.highest_wpm) + ' WPM' : '--';
        document.getElementById('avg-accuracy').textContent = data.avg_accuracy ? data.avg_accuracy.toFixed(1) + '%' : '--%';
    }
    
    showUserDetails(user) {
        const modal = document.getElementById('user-details-modal');
        
        // Populate modal content
        document.getElementById('modal-user-avatar').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('modal-username').textContent = user.username;
        document.getElementById('modal-join-date').textContent = `Joined: ${this.formatDate(user.join_date)}`;
        document.getElementById('modal-best-wpm').textContent = user.best_wpm ? Math.round(user.best_wpm) : '--';
        document.getElementById('modal-avg-wpm').textContent = user.avg_wpm ? Math.round(user.avg_wpm) : '--';
        document.getElementById('modal-accuracy').textContent = user.avg_accuracy ? user.avg_accuracy.toFixed(1) + '%' : '--%';
        document.getElementById('modal-tests').textContent = user.tests_completed || '--';
        
        // Show achievements
        this.displayUserAchievements(user);
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    displayUserAchievements(user) {
        const achievementsContainer = document.getElementById('modal-achievements');
        const achievements = this.getUserAchievements(user);
        
        if (achievements.length === 0) {
            achievementsContainer.innerHTML = '<p class="no-achievements">No achievements yet</p>';
            return;
        }
        
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-item">
                <span class="achievement-icon">${achievement.icon}</span>
                <span class="achievement-name">${achievement.name}</span>
            </div>
        `).join('');
    }
    
    getUserAchievements(user) {
        const achievements = [];
        
        if (user.tests_completed >= 1) {
            achievements.push({ icon: '🎯', name: 'First Test' });
        }
        if (user.tests_completed >= 10) {
            achievements.push({ icon: '🔥', name: 'Getting Started' });
        }
        if (user.tests_completed >= 100) {
            achievements.push({ icon: '🏆', name: 'Century Club' });
        }
        if (user.best_wpm >= 40) {
            achievements.push({ icon: '⚡', name: 'Speed Demon' });
        }
        if (user.best_wpm >= 100) {
            achievements.push({ icon: '🚀', name: 'Lightning Fast' });
        }
        if (user.avg_accuracy >= 95) {
            achievements.push({ icon: '🎯', name: 'Accuracy Expert' });
        }
        
        return achievements;
    }
    
    showLoadingState() {
        const tableBody = document.getElementById('leaderboard-list');
        tableBody.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner"></div>
                <p>Loading leaderboard...</p>
            </div>
        `;
    }
    
    showErrorState(message) {
        const tableBody = document.getElementById('leaderboard-list');
        tableBody.innerHTML = `
            <div class="error-state">
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="leaderboard.loadLeaderboard()">Try Again</button>
            </div>
        `;
    }
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Pagination
    loadPage(direction) {
        const newPage = this.currentPage + direction;
        const totalPages = parseInt(document.getElementById('total-pages').textContent);
        
        if (newPage < 1 || newPage > totalPages) return;
        
        this.currentPage = newPage;
        this.loadLeaderboard();
    }
    
    // Periodic refresh
    startPeriodicRefresh() {
        // Refresh leaderboard every 2 minutes
        setInterval(() => {
            this.clearCache();
            this.loadLeaderboard();
            this.loadUserRank();
            this.loadGlobalStats();
        }, 2 * 60 * 1000);
    }
    
    // Public API
    refresh() {
        this.clearCache();
        this.loadLeaderboard();
        this.loadUserRank();
        this.loadGlobalStats();
    }
}

// Utility functions
window.loadPage = function(direction) {
    if (window.leaderboard) {
        window.leaderboard.loadPage(direction);
    }
};

window.refreshLeaderboard = function() {
    if (window.leaderboard) {
        window.leaderboard.refresh();
    }
};

window.closeModal = function() {
    const modal = document.getElementById('user-details-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Handle modal click outside to close
document.addEventListener('click', function(e) {
    const modal = document.getElementById('user-details-modal');
    if (modal && e.target === modal) {
        window.closeModal();
    }
});

// Export for global use
window.Leaderboard = Leaderboard;