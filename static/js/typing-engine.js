// Client-side typing engine with comprehensive local processing
class CostOptimizedTypingEngine {
    constructor() {
        this.localStats = new Map();
        this.clientSideValidator = new ClientValidator();
        this.offlineMode = false;
        this.batchUpdates = [];
        this.lastServerSync = null;
        
        // Current test state
        this.currentTest = null;
        this.startTime = null;
        this.endTime = null;
        this.keystrokes = [];
        this.errors = [];
        this.typedText = '';
        this.isActive = false;
        this.duration = 30;
        this.difficulty = 'medium';
        
        // Performance tracking
        this.focusLostCount = 0;
        this.suspiciousEvents = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Optimized event handling for real-time typing
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent copy-paste for anti-cheating
        document.addEventListener('paste', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.recordSuspiciousEvent('paste_attempt');
            }
        });
        
        // Track focus loss
        window.addEventListener('blur', () => {
            if (this.isActive) {
                this.focusLostCount++;
                this.recordSuspiciousEvent('focus_lost');
            }
        });
        
        // Disable right-click context menu during test
        document.addEventListener('contextmenu', (e) => {
            if (this.isActive) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(e) {
        if (!this.isActive) return;
        
        // Start timer on first keystroke
        if (!this.startTime) {
            this.startTime = performance.now();
        }
        
        const key = e.key;
        
        // Handle special keys
        if (key === 'Escape') {
            this.stopTest();
            return;
        }
        
        if (key === 'Tab') {
            e.preventDefault();
            return;
        }
        
        // Only process printable characters and backspace
        if (key.length === 1 || key === 'Backspace') {
            e.preventDefault();
            this.handleTyping(key);
        }
    }
    
    handleKeyUp(e) {
        // Track key release for anti-cheating
        if (this.isActive && e.key.length === 1) {
            const now = performance.now();
            const keystroke = this.keystrokes[this.keystrokes.length - 1];
            if (keystroke && keystroke.timestamp > now - 100) {
                keystroke.duration = now - keystroke.timestamp;
            }
        }
    }
    
    handleTyping(key) {
        const now = performance.now();
        const position = this.typedText.length;
        
        if (key === 'Backspace') {
            if (this.typedText.length > 0) {
                this.typedText = this.typedText.slice(0, -1);
                this.updateDisplay();
                this.recordKeystroke(key, now, position, true);
            }
            return;
        }
        
        // Don't allow typing beyond the text length
        if (position >= this.currentTest.text.length) {
            return;
        }
        
        // Add character to typed text
        this.typedText += key;
        
        // Validate character
        const expectedChar = this.currentTest.text[position];
        const isCorrect = key === expectedChar;
        
        // Record keystroke
        this.recordKeystroke(key, now, position, isCorrect);
        
        // Update display and stats
        this.updateDisplay();
        this.updateStats();
        
        // Check if test is complete
        if (this.typedText.length >= this.currentTest.text.length) {
            this.completeTest();
        }
        
        // Real-time server sync for anti-cheating (every 10 keystrokes)
        if (this.keystrokes.length % 10 === 0) {
            this.syncProgress();
        }
    }
    
    recordKeystroke(key, timestamp, position, isCorrect) {
        const keystroke = {
            key: key,
            timestamp: timestamp,
            position: position,
            correct: isCorrect,
            timeDiff: this.keystrokes.length > 0 ? 
                     timestamp - this.keystrokes[this.keystrokes.length - 1].timestamp : 0
        };
        
        this.keystrokes.push(keystroke);
        
        // Detect suspicious typing patterns
        if (keystroke.timeDiff < 50 && key !== 'Backspace') {
            this.recordSuspiciousEvent('rapid_typing', {
                timeDiff: keystroke.timeDiff,
                key: key
            });
        }
    }
    
    recordSuspiciousEvent(type, data = {}) {
        this.suspiciousEvents.push({
            type: type,
            timestamp: performance.now(),
            data: data
        });
    }
    
    updateDisplay() {
        const textDisplay = document.getElementById('text-display');
        if (!textDisplay || !this.currentTest) return;
        
        const originalText = this.currentTest.text;
        const typedText = this.typedText;
        
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < originalText.length; i++) {
            const span = document.createElement('span');
            span.textContent = originalText[i];
            
            if (i >= typedText.length) {
                span.className = 'untyped';
            } else if (originalText[i] === typedText[i]) {
                span.className = 'correct';
            } else {
                span.className = 'incorrect';
                // Add error animation
                span.style.animation = 'error-shake 0.3s ease-in-out';
            }
            
            if (i === typedText.length) {
                span.className += ' current';
            }
            
            fragment.appendChild(span);
        }
        
        // Single DOM update for performance
        textDisplay.innerHTML = '';
        textDisplay.appendChild(fragment);
    }
    
    updateStats() {
        if (!this.startTime) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        const wpm = this.calculateWPM(elapsed);
        const accuracy = this.calculateAccuracy();
        const progress = (this.typedText.length / this.currentTest.text.length) * 100;
        
        // Smooth number transitions
        this.animateNumber('wpm-display', wpm);
        this.animateNumber('accuracy-display', accuracy, '%');
        this.animateNumber('timer-display', Math.max(0, this.duration - elapsed));
        this.animateNumber('progress-display', progress, '%');
        
        // Update progress bar
        this.updateProgressBar(progress);
        
        // Check time limit
        if (elapsed >= this.duration) {
            this.completeTest();
        }
    }
    
    calculateWPM(elapsedSeconds) {
        if (elapsedSeconds === 0) return 0;
        
        // Standard: 5 characters = 1 word
        const wordsTyped = this.typedText.length / 5;
        const minutes = elapsedSeconds / 60;
        const wpm = wordsTyped / minutes;
        
        return Math.round(wpm);
    }
    
    calculateAccuracy() {
        if (this.typedText.length === 0) return 100;
        
        let correctChars = 0;
        const minLength = Math.min(this.typedText.length, this.currentTest.text.length);
        
        for (let i = 0; i < minLength; i++) {
            if (this.typedText[i] === this.currentTest.text[i]) {
                correctChars++;
            }
        }
        
        const accuracy = (correctChars / this.typedText.length) * 100;
        return Math.round(accuracy * 10) / 10; // Round to 1 decimal place
    }
    
    animateNumber(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const current = parseFloat(element.textContent) || 0;
        const target = Math.round(value);
        
        if (current === target) return;
        
        const duration = 200;
        const steps = 10;
        const stepSize = (target - current) / steps;
        const stepDuration = duration / steps;
        
        let step = 0;
        const interval = setInterval(() => {
            step++;
            const newValue = current + (stepSize * step);
            
            if (step >= steps) {
                element.textContent = target + suffix;
                clearInterval(interval);
            } else {
                element.textContent = Math.round(newValue) + suffix;
            }
        }, stepDuration);
    }
    
    updateProgressBar(progress) {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, progress)}%`;
        }
    }
    
    async startTest(duration = 30, difficulty = 'medium') {
        this.duration = duration;
        this.difficulty = difficulty;
        
        // Reset test state
        this.currentTest = null;
        this.startTime = null;
        this.endTime = null;
        this.keystrokes = [];
        this.errors = [];
        this.typedText = '';
        this.focusLostCount = 0;
        this.suspiciousEvents = [];
        
        try {
            // Get test text
            const textData = await this.getTestText(duration, difficulty);
            
            this.currentTest = {
                text: textData.text,
                wordCount: textData.word_count,
                characterCount: textData.character_count
            };
            
            // Start session on server
            const sessionData = await this.startServerSession();
            this.currentTest.sessionId = sessionData.session_id;
            
            // Initialize display
            this.updateDisplay();
            this.isActive = true;
            
            // Focus the typing area
            const typingArea = document.getElementById('typing-area');
            if (typingArea) {
                typingArea.focus();
            }
            
            // Update UI
            this.updateTestControls(true);
            
            console.log('Test started:', this.currentTest);
            
        } catch (error) {
            console.error('Failed to start test:', error);
            this.handleTestError('Failed to start test. Please try again.');
        }
    }
    
    async getTestText(duration, difficulty) {
        const response = await fetch(`/typing/api/text/?duration=${duration}&difficulty=${difficulty}`);
        
        if (!response.ok) {
            throw new Error('Failed to get test text');
        }
        
        return await response.json();
    }
    
    async startServerSession() {
        const response = await fetch('/typing/api/start/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.csrfToken || ''
            },
            body: JSON.stringify({
                duration: this.duration,
                text_content: this.currentTest.text
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start server session');
        }
        
        return await response.json();
    }
    
    stopTest() {
        this.isActive = false;
        this.endTime = performance.now();
        this.updateTestControls(false);
        
        // Show test results without completing
        this.showResults(false);
    }
    
    async completeTest() {
        this.isActive = false;
        this.endTime = performance.now();
        
        const actualTime = (this.endTime - this.startTime) / 1000;
        
        try {
            // Complete session on server
            const result = await this.completeServerSession(actualTime);
            
            // Store session locally
            this.storeLocalSession(result.session);
            
            // Update local statistics
            this.updateLocalUserStats(result.session);
            
            // Show results
            this.showResults(true, result.session, result.is_new_record);
            
            // Trigger celebration if new record
            if (result.is_new_record && window.celebrationManager) {
                window.celebrationManager.triggerCelebration(result.session);
            }
            
        } catch (error) {
            console.error('Failed to complete test:', error);
            
            // Fallback: calculate results locally
            const localResults = this.calculateLocalResults(actualTime);
            this.showResults(true, localResults, false);
        }
        
        this.updateTestControls(false);
    }
    
    async completeServerSession(actualTime) {
        const response = await fetch('/typing/api/complete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.csrfToken || ''
            },
            body: JSON.stringify({
                session_id: this.currentTest.sessionId,
                typed_text: this.typedText,
                actual_time: actualTime,
                focus_lost_count: this.focusLostCount,
                suspicious_events: this.suspiciousEvents
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to complete server session');
        }
        
        return await response.json();
    }
    
    calculateLocalResults(actualTime) {
        const wpm = this.calculateWPM(actualTime);
        const accuracy = this.calculateAccuracy();
        
        return {
            wpm: wpm,
            accuracy: accuracy,
            typing_time: actualTime,
            correct_chars: this.countCorrectChars(),
            incorrect_chars: this.countIncorrectChars(),
            total_chars: this.typedText.length
        };
    }
    
    countCorrectChars() {
        let correct = 0;
        const minLength = Math.min(this.typedText.length, this.currentTest.text.length);
        
        for (let i = 0; i < minLength; i++) {
            if (this.typedText[i] === this.currentTest.text[i]) {
                correct++;
            }
        }
        
        return correct;
    }
    
    countIncorrectChars() {
        return this.typedText.length - this.countCorrectChars();
    }
    
    storeLocalSession(sessionData) {
        try {
            const sessions = JSON.parse(localStorage.getItem('neotype_sessions') || '[]');
            sessions.push({
                ...sessionData,
                timestamp: Date.now(),
                synced: true
            });
            
            // Keep only last 100 sessions
            if (sessions.length > 100) {
                sessions.splice(0, sessions.length - 100);
            }
            
            localStorage.setItem('neotype_sessions', JSON.stringify(sessions));
        } catch (e) {
            console.warn('Could not store session locally');
        }
    }
    
    updateLocalUserStats(sessionData) {
        try {
            const stats = JSON.parse(localStorage.getItem('neotype_user_stats') || '{}');
            
            stats.total_tests = (stats.total_tests || 0) + 1;
            stats.completed_tests = (stats.completed_tests || 0) + 1;
            
            // Update best WPM by duration
            const bestKey = `best_wpm_${this.duration}s`;
            if (!stats[bestKey] || sessionData.wpm > stats[bestKey]) {
                stats[bestKey] = sessionData.wpm;
            }
            
            // Update averages (simplified)
            stats.avg_wpm = (stats.avg_wpm || 0) * 0.9 + sessionData.wpm * 0.1;
            stats.avg_accuracy = (stats.avg_accuracy || 0) * 0.9 + sessionData.accuracy * 0.1;
            
            localStorage.setItem('neotype_user_stats', JSON.stringify(stats));
        } catch (e) {
            console.warn('Could not update local user stats');
        }
    }
    
    showResults(completed, sessionData, isNewRecord = false) {
        const modal = document.getElementById('results-modal');
        if (!modal) return;
        
        // Update results display
        if (sessionData) {
            document.getElementById('result-wpm').textContent = Math.round(sessionData.wpm);
            document.getElementById('result-accuracy').textContent = sessionData.accuracy.toFixed(1) + '%';
            document.getElementById('result-time').textContent = sessionData.typing_time.toFixed(1) + 's';
            document.getElementById('result-correct').textContent = sessionData.correct_chars;
            document.getElementById('result-errors').textContent = sessionData.incorrect_chars;
        }
        
        // Update modal title
        const title = document.getElementById('results-title');
        if (title) {
            title.textContent = completed ? 'Test Complete!' : 'Test Stopped';
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Focus first button
        const firstButton = modal.querySelector('.btn');
        if (firstButton) {
            firstButton.focus();
        }
    }
    
    updateTestControls(testActive) {
        const startBtn = document.getElementById('start-test');
        const resetBtn = document.getElementById('reset-test');
        
        if (startBtn) {
            startBtn.disabled = testActive;
            startBtn.textContent = testActive ? 'Test in Progress...' : 'Start Test';
        }
        
        if (resetBtn) {
            resetBtn.disabled = !testActive;
        }
    }
    
    handleTestError(message) {
        if (window.NeoType && window.NeoType.showMessage) {
            window.NeoType.showMessage(message, 'error');
        } else {
            alert(message);
        }
    }
    
    // Generate text content client-side to reduce server calls
    generateTypingText(difficulty = 'medium', length = 100) {
        const wordLists = {
            easy: ['the', 'and', 'for', 'you', 'are', 'with', 'this', 'that', 'have', 'from'],
            medium: ['people', 'about', 'would', 'could', 'there', 'their', 'think', 'where', 'being', 'right'],
            hard: ['government', 'development', 'management', 'information', 'environment', 'community', 'university', 'technology', 'opportunity', 'experience']
        };
        
        const words = wordLists[difficulty];
        const text = [];
        
        for (let i = 0; i < length; i++) {
            text.push(words[Math.floor(Math.random() * words.length)]);
        }
        
        return text.join(' ');
    }
    
    // Batch updates to minimize server load
    queueForBatchUpload(data) {
        this.batchUpdates.push({
            timestamp: Date.now(),
            data: data
        });
        
        // Upload batch every 10 sessions or 5 minutes
        if (this.batchUpdates.length >= 10 || 
            (Date.now() - this.lastServerSync) > 300000) {
            this.uploadBatchToServer();
        }
    }
    
    // Minimal server communication
    async uploadBatchToServer() {
        if (this.batchUpdates.length === 0) return;
        
        try {
            const response = await fetch('/api/batch-update/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessions: this.batchUpdates,
                    compressed: true
                })
            });
            
            if (response.ok) {
                this.batchUpdates = [];
                this.lastServerSync = Date.now();
            }
        } catch (error) {
            console.log('Server sync failed, continuing offline');
            this.offlineMode = true;
        }
    }
    
    async syncProgress() {
        // Implement minimal progress sync if needed
        // This is called every 10 keystrokes for anti-cheating
    }
}

// Client-side validator for anti-cheating
class ClientValidator {
    constructor() {
        this.suspiciousPatterns = [];
    }
    
    validateTypingSession(keystrokes) {
        // Implement client-side validation logic
        return true;
    }
}

// Initialize typing engine when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.typingEngine = new CostOptimizedTypingEngine();
    
    // Set up test controls
    const startBtn = document.getElementById('start-test');
    const resetBtn = document.getElementById('reset-test');
    const tryAgainBtn = document.getElementById('try-again');
    const resultsModal = document.getElementById('results-modal');
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            const duration = parseInt(document.querySelector('.duration-btn.active')?.dataset.duration || '30');
            const difficulty = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'medium';
            
            window.typingEngine.startTest(duration, difficulty);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            window.typingEngine.stopTest();
        });
    }
    
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            if (resultsModal) {
                resultsModal.classList.add('hidden');
            }
            
            // Start new test with same settings
            const duration = parseInt(document.querySelector('.duration-btn.active')?.dataset.duration || '30');
            const difficulty = document.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'medium';
            
            window.typingEngine.startTest(duration, difficulty);
        });
    }
    
    // Duration and difficulty selector handlers
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Close modals on background click
    if (resultsModal) {
        resultsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
        
        // Enter to start test (when not typing)
        if (e.key === 'Enter' && !window.typingEngine.isActive) {
            if (document.activeElement?.tagName !== 'BUTTON') {
                e.preventDefault();
                startBtn?.click();
            }
        }
    });
});