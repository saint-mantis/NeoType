// Authentication Form Validation
class AuthValidator {
    constructor() {
        this.validators = {
            username: this.validateUsername.bind(this),
            email: this.validateEmail.bind(this),
            password: this.validatePassword.bind(this),
            confirm_password: this.validateConfirmPassword.bind(this)
        };
        
        this.debounceTimers = {};
        this.debounceDelay = 300;
    }
    
    // Username validation
    validateUsername(value) {
        const errors = [];
        
        if (!value || value.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        
        if (value.length > 30) {
            errors.push('Username cannot exceed 30 characters');
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            strength: this.calculateUsernameStrength(value)
        };
    }
    
    // Email validation
    validateEmail(value) {
        const errors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!value) {
            errors.push('Email is required');
        } else if (!emailRegex.test(value)) {
            errors.push('Please enter a valid email address');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Password validation
    validatePassword(value) {
        const errors = [];
        
        if (!value) {
            errors.push('Password is required');
        } else {
            if (value.length < 8) {
                errors.push('Password must be at least 8 characters long');
            }
            
            if (!/[A-Z]/.test(value)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            
            if (!/[a-z]/.test(value)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            
            if (!/\d/.test(value)) {
                errors.push('Password must contain at least one number');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(value)
        };
    }
    
    // Confirm password validation
    validateConfirmPassword(value, originalPassword) {
        const errors = [];
        
        if (!value) {
            errors.push('Please confirm your password');
        } else if (value !== originalPassword) {
            errors.push('Passwords do not match');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Calculate username strength
    calculateUsernameStrength(username) {
        if (!username) return 'weak';
        
        let score = 0;
        
        // Length score
        if (username.length >= 5) score += 1;
        if (username.length >= 8) score += 1;
        
        // Character variety
        if (/[a-z]/.test(username)) score += 1;
        if (/[A-Z]/.test(username)) score += 1;
        if (/\d/.test(username)) score += 1;
        if (/_/.test(username)) score += 1;
        
        if (score >= 5) return 'strong';
        if (score >= 3) return 'good';
        if (score >= 1) return 'fair';
        return 'weak';
    }
    
    // Calculate password strength
    calculatePasswordStrength(password) {
        if (!password) return 'weak';
        
        let score = 0;
        
        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        // Character types
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 2;
        
        // Patterns
        if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
        if (!/012|123|234|345|456|567|678|789|890/.test(password)) score += 1; // No sequences
        
        if (score >= 8) return 'strong';
        if (score >= 6) return 'good';
        if (score >= 4) return 'fair';
        return 'weak';
    }
    
    // Validate field with debouncing
    validateField(fieldName, value, additionalData = {}) {
        clearTimeout(this.debounceTimers[fieldName]);
        
        this.debounceTimers[fieldName] = setTimeout(() => {
            const validator = this.validators[fieldName];
            if (validator) {
                let result;
                
                if (fieldName === 'confirm_password') {
                    result = validator(value, additionalData.originalPassword);
                } else {
                    result = validator(value);
                }
                
                this.updateFieldUI(fieldName, result);
            }
        }, this.debounceDelay);
    }
    
    // Update field UI based on validation result
    updateFieldUI(fieldName, result) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        const formGroup = field?.closest('.form-group');
        
        if (!field || !formGroup) return;
        
        // Clear previous states
        formGroup.classList.remove('success', 'error');
        
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
        
        if (result.isValid && field.value.length > 0) {
            formGroup.classList.add('success');
            this.showValidationFeedback(fieldName, 'success', 'Valid');
        } else if (result.errors.length > 0 && field.value.length > 0) {
            formGroup.classList.add('error');
            
            if (errorElement) {
                errorElement.textContent = result.errors[0];
                errorElement.classList.add('show');
            }
            
            this.showValidationFeedback(fieldName, 'error', result.errors[0]);
        }
        
        // Update strength indicator for password
        if (fieldName === 'password' && result.strength) {
            this.updatePasswordStrength(result.strength);
        }
    }
    
    // Show validation feedback
    showValidationFeedback(fieldName, type, message) {
        const field = document.getElementById(fieldName);
        const formGroup = field?.closest('.form-group');
        
        if (!formGroup) return;
        
        // Remove existing feedback
        const existingFeedback = formGroup.querySelector('.validation-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Create new feedback
        const feedback = document.createElement('div');
        feedback.className = `validation-feedback ${type}`;
        feedback.textContent = message;
        
        formGroup.appendChild(feedback);
        
        // Auto-remove after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 3000);
        }
    }
    
    // Update password strength indicator
    updatePasswordStrength(strength) {
        const strengthElement = document.getElementById('password-strength');
        
        if (strengthElement) {
            strengthElement.setAttribute('data-strength', strength);
            
            // Update aria-label for accessibility
            const strengthTexts = {
                weak: 'Weak password',
                fair: 'Fair password',
                good: 'Good password',
                strong: 'Strong password'
            };
            
            strengthElement.setAttribute('aria-label', strengthTexts[strength] || 'Password strength');
        }
    }
    
    // Validate entire form
    validateForm(formData) {
        const results = {};
        let isFormValid = true;
        
        Object.keys(this.validators).forEach(fieldName => {
            if (formData.hasOwnProperty(fieldName)) {
                let result;
                
                if (fieldName === 'confirm_password') {
                    result = this.validators[fieldName](formData[fieldName], formData.password);
                } else {
                    result = this.validators[fieldName](formData[fieldName]);
                }
                
                results[fieldName] = result;
                
                if (!result.isValid) {
                    isFormValid = false;
                    this.updateFieldUI(fieldName, result);
                }
            }
        });
        
        return {
            isValid: isFormValid,
            results: results,
            errors: this.getAllErrors(results)
        };
    }
    
    // Get all errors from validation results
    getAllErrors(results) {
        const allErrors = [];
        
        Object.values(results).forEach(result => {
            if (result.errors) {
                allErrors.push(...result.errors);
            }
        });
        
        return allErrors;
    }
    
    // Check username availability (debounced)
    async checkUsernameAvailability(username) {
        if (!username || username.length < 3) return;
        
        try {
            const response = await fetch('/accounts/check-username/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.csrfToken || ''
                },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            
            const field = document.getElementById('username');
            const formGroup = field?.closest('.form-group');
            
            if (data.available) {
                this.showValidationFeedback('username', 'success', 'Username is available');
                formGroup?.classList.add('success');
            } else {
                this.showValidationFeedback('username', 'error', 'Username is already taken');
                formGroup?.classList.add('error');
            }
        } catch (error) {
            console.warn('Could not check username availability');
        }
    }
    
    // Real-time validation setup
    setupRealTimeValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const fields = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        
        fields.forEach(field => {
            // Input event for real-time validation
            field.addEventListener('input', (e) => {
                const fieldName = e.target.name || e.target.id;
                const value = e.target.value;
                
                if (this.validators[fieldName]) {
                    const additionalData = {};
                    
                    if (fieldName === 'confirm_password') {
                        const passwordField = form.querySelector('[name="password"]');
                        additionalData.originalPassword = passwordField?.value || '';
                    }
                    
                    this.validateField(fieldName, value, additionalData);
                }
                
                // Check username availability
                if (fieldName === 'username' && value.length >= 3) {
                    clearTimeout(this.usernameCheckTimer);
                    this.usernameCheckTimer = setTimeout(() => {
                        this.checkUsernameAvailability(value);
                    }, 500);
                }
            });
            
            // Blur event for final validation
            field.addEventListener('blur', (e) => {
                const fieldName = e.target.name || e.target.id;
                const value = e.target.value;
                
                if (this.validators[fieldName] && value.length > 0) {
                    const additionalData = {};
                    
                    if (fieldName === 'confirm_password') {
                        const passwordField = form.querySelector('[name="password"]');
                        additionalData.originalPassword = passwordField?.value || '';
                    }
                    
                    // Immediate validation on blur
                    clearTimeout(this.debounceTimers[fieldName]);
                    
                    let result;
                    if (fieldName === 'confirm_password') {
                        result = this.validators[fieldName](value, additionalData.originalPassword);
                    } else {
                        result = this.validators[fieldName](value);
                    }
                    
                    this.updateFieldUI(fieldName, result);
                }
            });
            
            // Focus event to clear errors
            field.addEventListener('focus', (e) => {
                const formGroup = e.target.closest('.form-group');
                const feedback = formGroup?.querySelector('.validation-feedback.error');
                
                if (feedback) {
                    feedback.remove();
                }
                
                formGroup?.classList.remove('error');
            });
        });
    }
}

// Form submission handlers
class AuthFormHandler {
    constructor() {
        this.validator = new AuthValidator();
        this.isSubmitting = false;
    }
    
    async handleSignup(formData) {
        if (this.isSubmitting) return;
        
        // Validate form
        const validation = this.validator.validateForm(formData);
        
        if (!validation.isValid) {
            this.showFormErrors(validation.errors);
            return { success: false, errors: validation.errors };
        }
        
        this.setFormLoading(true);
        
        try {
            const result = await window.auth.signup(formData);
            
            if (result.success) {
                this.showFormSuccess('Account created successfully! Redirecting...');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showFormErrors(result.errors);
            }
            
            return result;
            
        } catch (error) {
            this.showFormErrors(['An unexpected error occurred. Please try again.']);
            return { success: false, errors: ['Network error'] };
        } finally {
            this.setFormLoading(false);
        }
    }
    
    async handleLogin(username, password) {
        if (this.isSubmitting) return;
        
        if (!username || !password) {
            this.showFormErrors(['Please enter both username and password']);
            return { success: false };
        }
        
        this.setFormLoading(true);
        
        try {
            const result = await window.auth.login(username, password);
            
            if (result.success) {
                this.showFormSuccess('Login successful! Redirecting...');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showFormErrors([result.error]);
            }
            
            return result;
            
        } catch (error) {
            this.showFormErrors(['An unexpected error occurred. Please try again.']);
            return { success: false };
        } finally {
            this.setFormLoading(false);
        }
    }
    
    setFormLoading(loading) {
        this.isSubmitting = loading;
        
        const forms = document.querySelectorAll('.auth-form');
        const buttons = document.querySelectorAll('.auth-form .btn');
        const inputs = document.querySelectorAll('.auth-form input');
        
        forms.forEach(form => {
            if (loading) {
                form.classList.add('loading');
            } else {
                form.classList.remove('loading');
            }
        });
        
        buttons.forEach(btn => {
            const textSpan = btn.querySelector('.btn-text');
            const spinnerSpan = btn.querySelector('.btn-spinner');
            
            if (loading) {
                btn.disabled = true;
                if (textSpan) textSpan.classList.add('hidden');
                if (spinnerSpan) spinnerSpan.classList.remove('hidden');
            } else {
                btn.disabled = false;
                if (textSpan) textSpan.classList.remove('hidden');
                if (spinnerSpan) spinnerSpan.classList.add('hidden');
            }
        });
        
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }
    
    showFormErrors(errors) {
        // Remove existing error messages
        this.clearFormMessages();
        
        if (errors && errors.length > 0) {
            const errorContainer = this.createMessageContainer('error');
            errorContainer.innerHTML = `
                <strong>Please fix the following errors:</strong>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
        }
    }
    
    showFormSuccess(message) {
        this.clearFormMessages();
        
        const successContainer = this.createMessageContainer('success');
        successContainer.textContent = message;
    }
    
    createMessageContainer(type) {
        const container = document.createElement('div');
        container.className = `form-message form-message-${type}`;
        container.style.cssText = `
            padding: var(--space-md);
            margin-bottom: var(--space-lg);
            border-radius: var(--radius-md);
            background: ${type === 'error' ? 'var(--color-error)' : 'var(--color-success)'};
            color: white;
            font-size: 0.875rem;
            animation: message-appear 0.3s ease-out;
        `;
        
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(container, form.firstChild);
        }
        
        return container;
    }
    
    clearFormMessages() {
        const messages = document.querySelectorAll('.form-message');
        messages.forEach(msg => msg.remove());
    }
}

// Initialize functions
function initSignupValidation() {
    const validator = new AuthValidator();
    const formHandler = new AuthFormHandler();
    
    // Setup real-time validation
    validator.setupRealTimeValidation('signup-form');
    
    // Handle form submission
    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                username: form.username.value.trim(),
                email: form.email.value.trim(),
                password: form.password.value,
                confirm_password: form.confirm_password.value
            };
            
            await formHandler.handleSignup(formData);
        });
    }
}

function initLoginValidation() {
    const formHandler = new AuthFormHandler();
    
    // Handle form submission
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = form.username.value.trim();
            const password = form.password.value;
            
            await formHandler.handleLogin(username, password);
        });
    }
}

// Add CSS for animations
const authValidationStyles = `
    @keyframes message-appear {
        0% {
            opacity: 0;
            transform: translateY(-10px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .form-message ul {
        margin: var(--space-xs) 0 0 var(--space-md);
        padding: 0;
    }
    
    .form-message li {
        margin-bottom: var(--space-xs);
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = authValidationStyles;
    document.head.appendChild(styleSheet);
}

// Export for global use
window.AuthValidator = AuthValidator;
window.AuthFormHandler = AuthFormHandler;
window.initSignupValidation = initSignupValidation;
window.initLoginValidation = initLoginValidation;