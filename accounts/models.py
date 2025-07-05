from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Extended user model for typing test application"""
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Profile fields
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=50, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    
    # Privacy settings
    is_profile_public = models.BooleanField(default=True)
    show_email = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['date_joined']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.username
