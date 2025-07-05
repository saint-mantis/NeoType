// Authentication management for NeoType
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.loadUserFromStorage();
    }
    
    // Client-side form validation to reduce server load
    validateSignupForm(formData) {
        const errors = [];
        
        // Username validation
        if (!formData.username || formData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        if (formData.username.length > 30) {
            errors.push('Username cannot exceed 30 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }
        
        // Password validation
        if (!formData.password || formData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (formData.password !== formData.confirm_password) {
            errors.push('Passwords do not match');
        }
        
        // Password strength check
        if (!this.isStrongPassword(formData.password)) {
            errors.push('Password must contain uppercase, lowercase, and numbers');
        }
        
        return errors;
    }
    
    isStrongPassword(password) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        return hasUpper && hasLower && hasNumber;
    }
    
    async signup(formData) {
        // Client-side validation first
        const errors = this.validateSignupForm(formData);
        if (errors.length > 0) {
            return { success: false, errors };
        }
        
        try {
            const response = await fetch('/accounts/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.saveUserToStorage(data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, errors: data.errors || [data.error] };
            }
        } catch (error) {
            return { success: false, errors: ['Network error. Please try again.'] };
        }
    }
    
    async login(username, password) {
        try {
            const response = await fetch('/accounts/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.saveUserToStorage(data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    async logout() {
        try {
            await fetch('/accounts/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
        } catch (error) {
            console.log('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.clearUserFromStorage();
        }
    }
    
    // Local storage management for better UX
    saveUserToStorage(user) {
        try {
            localStorage.setItem('neotype_user', JSON.stringify({
                ...user,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Could not save user to localStorage');
        }
    }
    
    loadUserFromStorage() {
        try {
            const stored = localStorage.getItem('neotype_user');
            if (stored) {
                const userData = JSON.parse(stored);
                const hoursPassed = (Date.now() - userData.timestamp) / (1000 * 60 * 60);
                
                // Clear if older than 24 hours
                if (hoursPassed < 24) {
                    this.currentUser = userData;
                    this.isAuthenticated = true;
                } else {
                    this.clearUserFromStorage();
                }
            }
        } catch (e) {
            console.warn('Could not load user from localStorage');
            this.clearUserFromStorage();
        }
    }
    
    clearUserFromStorage() {
        try {
            localStorage.removeItem('neotype_user');
        } catch (e) {
            console.warn('Could not clear user from localStorage');
        }
    }
    
    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                     window.csrfToken;
        return token || '';
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Initialize authentication manager
if (typeof window !== 'undefined') {
    window.auth = new AuthManager();
}