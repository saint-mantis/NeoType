// Virtual Keyboard Implementation with Real-time Key Highlighting
class VirtualKeyboard {
    constructor() {
        this.keys = new Map();
        this.currentKey = null;
        this.isActive = false;
        this.keyLayout = this.getKeyboardLayout();
        this.init();
    }
    
    init() {
        this.createKeyboard();
        this.setupEventListeners();
        this.loadKeyboardPreferences();
    }
    
    getKeyboardLayout() {
        return {
            row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
            row4: [' '] // spacebar
        };
    }
    
    createKeyboard() {
        const keyboardContainer = document.getElementById('virtual-keyboard');
        if (!keyboardContainer) return;
        
        keyboardContainer.innerHTML = ''; // Clear existing content
        
        // Create each row
        Object.keys(this.keyLayout).forEach(rowKey => {
            const row = document.createElement('div');
            row.className = 'keyboard-row';
            
            this.keyLayout[rowKey].forEach(key => {
                const keyElement = this.createKeyElement(key);
                row.appendChild(keyElement);
                this.keys.set(key, keyElement);
            });
            
            keyboardContainer.appendChild(row);
        });
        
        // Add special keys
        this.addSpecialKeys();
    }
    
    createKeyElement(key) {
        const keyElement = document.createElement('button');
        keyElement.className = 'key';
        keyElement.setAttribute('data-key', key);
        keyElement.setAttribute('tabindex', '-1');
        keyElement.setAttribute('aria-label', `Key ${key === ' ' ? 'Space' : key.toUpperCase()}`);
        
        if (key === ' ') {
            keyElement.className += ' key-space';
            keyElement.textContent = 'Space';
        } else {
            keyElement.textContent = key.toUpperCase();
        }
        
        // Add click handler for accessibility
        keyElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.simulateKeyPress(key);
        });
        
        return keyElement;
    }
    
    addSpecialKeys() {
        const keyboardContainer = document.getElementById('virtual-keyboard');
        if (!keyboardContainer) return;
        
        // Add control keys row
        const controlRow = document.createElement('div');
        controlRow.className = 'keyboard-row keyboard-control-row';
        
        // Backspace key
        const backspaceKey = document.createElement('button');
        backspaceKey.className = 'key key-special key-backspace';
        backspaceKey.setAttribute('data-key', 'Backspace');
        backspaceKey.setAttribute('tabindex', '-1');
        backspaceKey.innerHTML = '⌫ Backspace';
        backspaceKey.addEventListener('click', (e) => {
            e.preventDefault();
            this.simulateKeyPress('Backspace');
        });
        
        // Enter key
        const enterKey = document.createElement('button');
        enterKey.className = 'key key-special key-enter';
        enterKey.setAttribute('data-key', 'Enter');
        enterKey.setAttribute('tabindex', '-1');
        enterKey.innerHTML = '↵ Enter';
        enterKey.addEventListener('click', (e) => {
            e.preventDefault();
            this.simulateKeyPress('Enter');
        });
        
        controlRow.appendChild(backspaceKey);
        controlRow.appendChild(enterKey);
        keyboardContainer.appendChild(controlRow);
        
        this.keys.set('Backspace', backspaceKey);
        this.keys.set('Enter', enterKey);
    }
    
    setupEventListeners() {
        // Listen for physical keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                this.highlightKey(e.key, true);
                this.setCurrentKey(e.key);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isActive) {
                this.highlightKey(e.key, false);
                if (this.currentKey === e.key) {
                    this.currentKey = null;
                }
            }
        });
        
        // Listen for typing engine events
        document.addEventListener('typingEngineStarted', () => {
            this.activate();
        });
        
        document.addEventListener('typingEngineStopped', () => {
            this.deactivate();
        });
        
        // Listen for theme changes
        document.addEventListener('themeChanged', (e) => {
            this.updateKeyboardTheme(e.detail.theme);
        });
    }
    
    activate() {
        this.isActive = true;
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.classList.add('active');
            keyboard.setAttribute('aria-hidden', 'false');
        }
    }
    
    deactivate() {
        this.isActive = false;
        this.clearAllHighlights();
        this.currentKey = null;
        
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.classList.remove('active');
            keyboard.setAttribute('aria-hidden', 'true');
        }
    }
    
    highlightKey(key, isPressed) {
        const normalizedKey = this.normalizeKey(key);
        const keyElement = this.keys.get(normalizedKey);
        
        if (keyElement) {
            if (isPressed) {
                keyElement.classList.add('pressed');
                this.animateKeyPress(keyElement);
            } else {
                keyElement.classList.remove('pressed');
            }
        }
    }
    
    setCurrentKey(key) {
        // Clear previous current key
        if (this.currentKey) {
            const prevKeyElement = this.keys.get(this.normalizeKey(this.currentKey));
            if (prevKeyElement) {
                prevKeyElement.classList.remove('current');
            }
        }
        
        // Set new current key
        this.currentKey = key;
        const normalizedKey = this.normalizeKey(key);
        const keyElement = this.keys.get(normalizedKey);
        
        if (keyElement) {
            keyElement.classList.add('current');
        }
    }
    
    highlightExpectedKey(expectedKey) {
        // Clear previous expected key highlights
        this.clearExpectedHighlights();
        
        const normalizedKey = this.normalizeKey(expectedKey);
        const keyElement = this.keys.get(normalizedKey);
        
        if (keyElement) {
            keyElement.classList.add('expected');
            
            // Add subtle pulse animation
            keyElement.style.animation = 'expected-pulse 2s infinite';
        }
    }
    
    showKeyFeedback(key, isCorrect) {
        const normalizedKey = this.normalizeKey(key);
        const keyElement = this.keys.get(normalizedKey);
        
        if (keyElement) {
            const feedbackClass = isCorrect ? 'correct-feedback' : 'incorrect-feedback';
            keyElement.classList.add(feedbackClass);
            
            // Remove feedback after animation
            setTimeout(() => {
                keyElement.classList.remove(feedbackClass);
            }, 300);
        }
    }
    
    animateKeyPress(keyElement) {
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'key-ripple';
        
        const rect = keyElement.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width / 2 - size / 2) + 'px';
        ripple.style.top = (rect.height / 2 - size / 2) + 'px';
        
        keyElement.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 300);
    }
    
    clearAllHighlights() {
        this.keys.forEach(keyElement => {
            keyElement.classList.remove('pressed', 'current', 'expected', 'correct-feedback', 'incorrect-feedback');
            keyElement.style.animation = '';
        });
    }
    
    clearExpectedHighlights() {
        this.keys.forEach(keyElement => {
            keyElement.classList.remove('expected');
            keyElement.style.animation = '';
        });
    }
    
    normalizeKey(key) {
        // Handle special cases
        if (key === ' ') return ' ';
        if (key === 'Backspace') return 'Backspace';
        if (key === 'Enter') return 'Enter';
        
        // Convert to lowercase for consistency
        return key.toLowerCase();
    }
    
    simulateKeyPress(key) {
        // Create and dispatch keyboard event
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: this.getKeyCode(key),
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
        
        // Also dispatch keyup after a short delay
        setTimeout(() => {
            const upEvent = new KeyboardEvent('keyup', {
                key: key,
                code: this.getKeyCode(key),
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(upEvent);
        }, 100);
    }
    
    getKeyCode(key) {
        const keyCodes = {
            ' ': 'Space',
            'Backspace': 'Backspace',
            'Enter': 'Enter'
        };
        
        return keyCodes[key] || `Key${key.toUpperCase()}`;
    }
    
    updateKeyboardTheme(theme) {
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.setAttribute('data-theme', theme);
        }
    }
    
    // Keyboard preferences (for future enhancement)
    loadKeyboardPreferences() {
        try {
            const prefs = JSON.parse(localStorage.getItem('neotype_keyboard_prefs') || '{}');
            
            if (prefs.layout) {
                this.setKeyboardLayout(prefs.layout);
            }
            
            if (prefs.size) {
                this.setKeyboardSize(prefs.size);
            }
            
            if (prefs.position) {
                this.setKeyboardPosition(prefs.position);
            }
        } catch (e) {
            console.warn('Could not load keyboard preferences');
        }
    }
    
    saveKeyboardPreferences() {
        try {
            const prefs = {
                layout: this.currentLayout,
                size: this.currentSize,
                position: this.currentPosition
            };
            
            localStorage.setItem('neotype_keyboard_prefs', JSON.stringify(prefs));
        } catch (e) {
            console.warn('Could not save keyboard preferences');
        }
    }
    
    setKeyboardLayout(layout) {
        // Support for different layouts (QWERTY, DVORAK, etc.)
        this.currentLayout = layout;
        // Implementation would recreate keyboard with different layout
    }
    
    setKeyboardSize(size) {
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.className = keyboard.className.replace(/keyboard-size-\w+/g, '');
            keyboard.classList.add(`keyboard-size-${size}`);
            this.currentSize = size;
        }
    }
    
    setKeyboardPosition(position) {
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.className = keyboard.className.replace(/keyboard-position-\w+/g, '');
            keyboard.classList.add(`keyboard-position-${position}`);
            this.currentPosition = position;
        }
    }
    
    // Public API
    getStats() {
        return {
            totalKeys: this.keys.size,
            isActive: this.isActive,
            currentKey: this.currentKey
        };
    }
    
    reset() {
        this.clearAllHighlights();
        this.currentKey = null;
    }
    
    hide() {
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.style.display = 'none';
        }
    }
    
    show() {
        const keyboard = document.getElementById('virtual-keyboard');
        if (keyboard) {
            keyboard.style.display = '';
        }
    }
}

// Enhanced integration with typing engine
class TypingKeyboardIntegration {
    constructor(typingEngine, virtualKeyboard) {
        this.typingEngine = typingEngine;
        this.virtualKeyboard = virtualKeyboard;
        this.setupIntegration();
    }
    
    setupIntegration() {
        // Override typing engine methods to integrate with virtual keyboard
        const originalHandleTyping = this.typingEngine.handleTyping.bind(this.typingEngine);
        
        this.typingEngine.handleTyping = (key) => {
            // Call original method
            const result = originalHandleTyping(key);
            
            // Update virtual keyboard based on typing
            if (this.typingEngine.isActive && this.typingEngine.currentTest) {
                const position = this.typingEngine.typedText.length;
                const expectedChar = this.typingEngine.currentTest.text[position];
                const isCorrect = key === expectedChar;
                
                // Show feedback on virtual keyboard
                this.virtualKeyboard.showKeyFeedback(key, isCorrect);
                
                // Highlight next expected key
                if (position < this.typingEngine.currentTest.text.length) {
                    const nextChar = this.typingEngine.currentTest.text[position];
                    this.virtualKeyboard.highlightExpectedKey(nextChar);
                }
            }
            
            return result;
        };
        
        // Override test start to activate virtual keyboard
        const originalStartTest = this.typingEngine.startTest.bind(this.typingEngine);
        
        this.typingEngine.startTest = async (...args) => {
            const result = await originalStartTest(...args);
            
            // Activate virtual keyboard and highlight first key
            this.virtualKeyboard.activate();
            
            if (this.typingEngine.currentTest && this.typingEngine.currentTest.text.length > 0) {
                const firstChar = this.typingEngine.currentTest.text[0];
                this.virtualKeyboard.highlightExpectedKey(firstChar);
            }
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('typingEngineStarted'));
            
            return result;
        };
        
        // Override test stop/complete to deactivate virtual keyboard
        const originalStopTest = this.typingEngine.stopTest.bind(this.typingEngine);
        
        this.typingEngine.stopTest = () => {
            const result = originalStopTest();
            this.virtualKeyboard.deactivate();
            document.dispatchEvent(new CustomEvent('typingEngineStopped'));
            return result;
        };
        
        const originalCompleteTest = this.typingEngine.completeTest.bind(this.typingEngine);
        
        this.typingEngine.completeTest = async () => {
            const result = await originalCompleteTest();
            this.virtualKeyboard.deactivate();
            document.dispatchEvent(new CustomEvent('typingEngineStopped'));
            return result;
        };
    }
}

// Initialize virtual keyboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create virtual keyboard instance
    window.virtualKeyboard = new VirtualKeyboard();
    
    // Integrate with typing engine when it's available
    if (window.typingEngine) {
        window.typingKeyboardIntegration = new TypingKeyboardIntegration(
            window.typingEngine, 
            window.virtualKeyboard
        );
    } else {
        // Wait for typing engine to be available
        const checkTypingEngine = setInterval(() => {
            if (window.typingEngine) {
                window.typingKeyboardIntegration = new TypingKeyboardIntegration(
                    window.typingEngine, 
                    window.virtualKeyboard
                );
                clearInterval(checkTypingEngine);
            }
        }, 100);
    }
    
    // Add keyboard controls
    const keyboardToggle = document.getElementById('keyboard-toggle');
    if (keyboardToggle) {
        keyboardToggle.addEventListener('click', function() {
            const keyboard = document.getElementById('virtual-keyboard');
            if (keyboard.style.display === 'none') {
                window.virtualKeyboard.show();
                this.textContent = 'Hide Keyboard';
            } else {
                window.virtualKeyboard.hide();
                this.textContent = 'Show Keyboard';
            }
        });
    }
});