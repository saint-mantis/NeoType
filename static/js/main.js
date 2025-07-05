// Main JavaScript for NeoType
document.addEventListener('DOMContentLoaded', function() {
    console.log('NeoType loaded successfully!');
    
    // Initialize theme
    initTheme();
    
    // Initialize mobile navigation
    initMobileNav();
    
    // Initialize message auto-dismiss
    initMessages();
    
    // Initialize CSRF token
    initCSRF();
});

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update button icon
            const icon = themeToggle.querySelector('.icon');
            if (icon) {
                icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
            }
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = themeToggle.querySelector('.icon');
        if (icon) {
            icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }
    }
}

function initMobileNav() {
    // Mobile navigation toggle (for future implementation)
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileNavToggle && mobileNav) {
        mobileNavToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
        });
    }
}

function initMessages() {
    // Auto-dismiss messages after 5 seconds
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(function(message) {
        setTimeout(function() {
            if (message.parentElement) {
                message.style.opacity = '0';
                message.style.transform = 'translateX(100%)';
                
                setTimeout(function() {
                    message.remove();
                }, 300);
            }
        }, 5000);
    });
}

function initCSRF() {
    // Get CSRF token and set up for AJAX requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    
    if (csrfToken) {
        window.csrfToken = csrfToken.getAttribute('content');
        
        // Set up default AJAX headers
        if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                if (options.method && options.method.toUpperCase() !== 'GET') {
                    options.headers = options.headers || {};
                    options.headers['X-CSRFToken'] = window.csrfToken;
                }
                return originalFetch(url, options);
            };
        }
    }
}

// Utility functions
function showMessage(text, type = 'info') {
    const messagesContainer = document.getElementById('messages') || createMessagesContainer();
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <span class="message-text">${text}</span>
        <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    messagesContainer.appendChild(message);
    
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
        if (message.parentElement) {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            
            setTimeout(function() {
                message.remove();
            }, 300);
        }
    }, 5000);
}

function createMessagesContainer() {
    const container = document.createElement('div');
    container.id = 'messages';
    container.className = 'messages';
    document.body.appendChild(container);
    return container;
}

function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function closeAchievementModal() {
    const modal = document.getElementById('achievement-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Export for global use
window.NeoType = {
    showMessage,
    showLoading,
    closeAchievementModal
};