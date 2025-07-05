from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class TestSession(models.Model):
    """Individual typing test session"""
    DURATION_CHOICES = [
        (15, '15 seconds'),
        (30, '30 seconds'),
        (60, '1 minute'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_sessions', null=True, blank=True)
    duration = models.PositiveSmallIntegerField(choices=DURATION_CHOICES, db_index=True)
    text_content = models.TextField()
    typed_text = models.TextField()
    
    # Performance Metrics
    wpm = models.FloatField(validators=[MinValueValidator(0.0)], db_index=True)
    accuracy = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    typing_time = models.FloatField(help_text="Actual time taken in seconds")
    completed = models.BooleanField(default=False, db_index=True)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional metrics
    correct_chars = models.PositiveIntegerField(default=0)
    incorrect_chars = models.PositiveIntegerField(default=0)
    total_chars = models.PositiveIntegerField(default=0)
    
    # Anti-cheating fields
    focus_lost_count = models.PositiveIntegerField(default=0)
    suspicious_events = models.JSONField(default=list, blank=True)
    
    # Guest session support
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'typing_test_sessions'
        indexes = [
            models.Index(fields=['user', '-started_at']),  # User's recent tests
            models.Index(fields=['duration', '-wpm']),     # Leaderboard by duration
            models.Index(fields=['completed', '-started_at']), # Completed tests
            models.Index(fields=['-wpm']),                 # Global leaderboard
            models.Index(fields=['user', 'duration', '-wpm']), # User best by duration
            models.Index(fields=['session_key']),          # Guest sessions
        ]
        ordering = ['-started_at']
    
    def __str__(self):
        user_info = self.user.username if self.user else f"Guest-{self.session_key[:8]}"
        return f"{user_info} - {self.duration}s - {self.wpm}WPM"
    
    def save(self, *args, **kwargs):
        if self.completed and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)


class UserStats(models.Model):
    """Aggregated user statistics for performance optimization"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    
    # Overall statistics
    total_tests = models.PositiveIntegerField(default=0)
    completed_tests = models.PositiveIntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    
    # Best performances by duration
    best_wpm_15s = models.FloatField(null=True, blank=True, db_index=True)
    best_wpm_30s = models.FloatField(null=True, blank=True, db_index=True)
    best_wpm_60s = models.FloatField(null=True, blank=True, db_index=True)
    
    best_accuracy_15s = models.FloatField(null=True, blank=True)
    best_accuracy_30s = models.FloatField(null=True, blank=True)
    best_accuracy_60s = models.FloatField(null=True, blank=True)
    
    # Average performances
    avg_wpm = models.FloatField(default=0.0, db_index=True)
    avg_accuracy = models.FloatField(default=0.0)
    
    # Streaks and achievements
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    total_time_typed = models.PositiveIntegerField(default=0)  # in seconds
    
    # Last activity
    last_test_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_stats'
        indexes = [
            models.Index(fields=['-best_wpm_15s']),
            models.Index(fields=['-best_wpm_30s']),
            models.Index(fields=['-best_wpm_60s']),
            models.Index(fields=['-avg_wpm']),
            models.Index(fields=['-completion_rate']),
            models.Index(fields=['last_test_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - Stats"
    
    def update_stats_from_session(self, session):
        """Update stats based on a new test session"""
        self.total_tests += 1
        if session.completed:
            self.completed_tests += 1
            
            # Update best WPM by duration
            wpm_field = f'best_wpm_{session.duration}s'
            current_best = getattr(self, wpm_field, None)
            if current_best is None or session.wpm > current_best:
                setattr(self, wpm_field, session.wpm)
            
            # Update best accuracy by duration
            accuracy_field = f'best_accuracy_{session.duration}s'
            current_best_acc = getattr(self, accuracy_field, None)
            if current_best_acc is None or session.accuracy > current_best_acc:
                setattr(self, accuracy_field, session.accuracy)
            
            # Update averages (simplified - in production you'd want running averages)
            completed_sessions = TestSession.objects.filter(
                user=self.user, completed=True
            )
            self.avg_wpm = completed_sessions.aggregate(
                models.Avg('wpm')
            )['wpm__avg'] or 0.0
            self.avg_accuracy = completed_sessions.aggregate(
                models.Avg('accuracy')
            )['accuracy__avg'] or 0.0
            
            self.total_time_typed += int(session.typing_time)
            self.last_test_at = session.completed_at
        
        self.completion_rate = (self.completed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        self.save()


class TextContent(models.Model):
    """Predefined text content for typing tests"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    ]
    
    CATEGORY_CHOICES = [
        ('common_words', 'Common Words'),
        ('programming', 'Programming'),
        ('literature', 'Literature'),
        ('technical', 'Technical'),
        ('business', 'Business'),
        ('science', 'Science'),
        ('poetry', 'Poetry'),
        ('news', 'News'),
        ('punctuation', 'Punctuation'),
        ('mixed_case', 'Mixed Case'),
        ('long_form', 'Long Form'),
        ('short_words', 'Short Words'),
        ('config', 'Configuration'),
        ('math', 'Mathematical'),
        ('email', 'Email'),
        ('mixed', 'Mixed'),
        ('pangram', 'Pangram'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='common_words', db_index=True)
    language = models.CharField(max_length=5, default='en', db_index=True)
    word_count = models.PositiveIntegerField(default=0)
    character_count = models.PositiveIntegerField(default=0)
    
    # Meta information
    source = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        db_table = 'text_content'
        indexes = [
            models.Index(fields=['difficulty', 'is_active']),
            models.Index(fields=['word_count']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.word_count:
            self.word_count = len(self.content.split())
        if not self.character_count:
            self.character_count = len(self.content)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} ({self.difficulty})"
