from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class LeaderboardEntry(models.Model):
    """Cached leaderboard entries for performance optimization"""
    DURATION_CHOICES = [
        (15, '15 seconds'),
        (30, '30 seconds'),
        (60, '1 minute'),
    ]
    
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_entries')
    duration = models.PositiveSmallIntegerField(choices=DURATION_CHOICES, db_index=True)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, db_index=True)
    
    # Performance metrics
    wpm = models.FloatField(db_index=True)
    accuracy = models.FloatField()
    composite_score = models.FloatField(db_index=True)  # Weighted score
    
    # Ranking information
    rank = models.PositiveIntegerField(db_index=True)
    total_entries = models.PositiveIntegerField()
    
    # Metadata
    test_session = models.ForeignKey('typing_test.TestSession', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    period_start = models.DateTimeField(db_index=True)
    period_end = models.DateTimeField(db_index=True)
    
    class Meta:
        db_table = 'leaderboard_entries'
        unique_together = ['user', 'duration', 'period', 'period_start']
        indexes = [
            models.Index(fields=['duration', 'period', '-composite_score']),
            models.Index(fields=['period_start', 'period_end']),
            models.Index(fields=['-wpm']),
            models.Index(fields=['rank']),
        ]
        ordering = ['rank']
    
    def __str__(self):
        return f"{self.user.username} - {self.duration}s {self.period} - Rank {self.rank}"
    
    @classmethod
    def calculate_composite_score(cls, wpm, accuracy):
        """Calculate weighted composite score (70% WPM, 30% accuracy)"""
        return round((wpm * 0.7) + (accuracy * 0.3), 2)
