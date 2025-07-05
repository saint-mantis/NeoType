// Theme management for NeoType
(function() {
    'use strict';
    
    // Theme constants
    const THEMES = {
        DARK: 'dark',
        LIGHT: 'light'
    };
    
    const STORAGE_KEY = 'neotype-theme';
    
    class ThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme() || THEMES.DARK;
            this.init();
        }
        
        init() {
            this.applyTheme(this.currentTheme);
            this.setupEventListeners();
            this.updateThemeToggleButton();
        }
        
        getStoredTheme() {
            try {
                return localStorage.getItem(STORAGE_KEY);
            } catch (e) {
                console.warn('Could not access localStorage for theme');
                return null;
            }
        }
        
        getSystemTheme() {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return THEMES.LIGHT;
            }
            return THEMES.DARK;
        }
        
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            this.currentTheme = theme;
            
            // Store theme preference
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (e) {
                console.warn('Could not save theme preference');
            }
            
            // Update meta theme-color for mobile browsers
            this.updateThemeColor(theme);
        }
        
        updateThemeColor(theme) {
            let themeColorMeta = document.querySelector('meta[name="theme-color"]');
            
            if (!themeColorMeta) {
                themeColorMeta = document.createElement('meta');
                themeColorMeta.name = 'theme-color';
                document.head.appendChild(themeColorMeta);
            }
            
            const colors = {
                [THEMES.DARK]: 'hsl(220, 13%, 9%)',
                [THEMES.LIGHT]: 'hsl(0, 0%, 100%)'
            };
            
            themeColorMeta.content = colors[theme];
        }
        
        toggleTheme() {
            const newTheme = this.currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
            this.applyTheme(newTheme);
            this.updateThemeToggleButton();
            
            // Trigger custom event for other components
            const event = new CustomEvent('themeChanged', {
                detail: { theme: newTheme }
            });
            document.dispatchEvent(event);
        }
        
        updateThemeToggleButton() {
            const themeToggle = document.getElementById('theme-toggle');
            
            if (themeToggle) {
                const icon = themeToggle.querySelector('.icon');
                if (icon) {
                    icon.textContent = this.currentTheme === THEMES.DARK ? '🌙' : '☀️';
                }
                
                // Update aria-label
                themeToggle.setAttribute('aria-label', 
                    `Switch to ${this.currentTheme === THEMES.DARK ? 'light' : 'dark'} theme`
                );
            }
        }
        
        setupEventListeners() {
            // Theme toggle button
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            
            // Listen for system theme changes
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
                mediaQuery.addEventListener('change', (e) => {
                    // Only auto-switch if user hasn't manually set a preference
                    if (!this.getStoredTheme()) {
                        const systemTheme = e.matches ? THEMES.LIGHT : THEMES.DARK;
                        this.applyTheme(systemTheme);
                        this.updateThemeToggleButton();
                    }
                });
            }
            
            // Keyboard shortcut (Ctrl/Cmd + Shift + T)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
        
        // Public API
        getCurrentTheme() {
            return this.currentTheme;
        }
        
        setTheme(theme) {
            if (Object.values(THEMES).includes(theme)) {
                this.applyTheme(theme);
                this.updateThemeToggleButton();
            }
        }
    }
    
    // Initialize theme manager when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.themeManager = new ThemeManager();
        });
    } else {
        window.themeManager = new ThemeManager();
    }
    
    // Export for global use
    window.THEMES = THEMES;
})();