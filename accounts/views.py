from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.contrib import messages
from django.http import JsonResponse
import json
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User
from typing_test.models import UserStats


@csrf_protect
@require_http_methods(["GET", "POST"])
def signup_view(request):
    """Handle user registration"""
    if request.method == 'GET':
        if request.user.is_authenticated:
            return redirect('/')
        return render(request, 'accounts/signup.html')
    
    # Handle POST request
    if request.content_type == 'application/json':
        return handle_ajax_signup(request)
    
    # Handle form submission
    username = request.POST.get('username', '').strip()
    email = request.POST.get('email', '').strip()
    password = request.POST.get('password', '')
    confirm_password = request.POST.get('confirm_password', '')
    
    # Validate form data
    errors = validate_signup_data(username, email, password, confirm_password)
    
    if errors:
        for error in errors:
            messages.error(request, error)
        return render(request, 'accounts/signup.html')
    
    # Rate limiting check
    cache_key = f'signup_attempts_{request.META.get("REMOTE_ADDR")}'
    attempts = cache.get(cache_key, 0)
    
    if attempts >= 3:  # Max 3 signup attempts per IP per hour
        messages.error(request, 'Too many signup attempts. Please try again later.')
        return render(request, 'accounts/signup.html')
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Initialize user statistics
        UserStats.objects.create(user=user)
        
        # Auto-login after signup
        login(request, user)
        
        # Reset signup attempts
        cache.delete(cache_key)
        
        messages.success(request, f'Welcome to NeoType, {username}!')
        return redirect('/')
        
    except Exception as e:
        # Increment failed attempts
        cache.set(cache_key, attempts + 1, 60 * 60)  # 1 hour
        
        if 'username' in str(e).lower():
            messages.error(request, 'Username already exists')
        elif 'email' in str(e).lower():
            messages.error(request, 'Email already registered')
        else:
            messages.error(request, 'Registration failed. Please try again.')
        
        return render(request, 'accounts/signup.html')


def handle_ajax_signup(request):
    """Handle AJAX signup requests"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Client-side validation backup
        errors = validate_signup_data(username, email, password, confirm_password)
        
        if errors:
            return JsonResponse({'success': False, 'errors': errors}, status=400)
        
        # Rate limiting check
        cache_key = f'signup_attempts_{request.META.get("REMOTE_ADDR")}'
        attempts = cache.get(cache_key, 0)
        
        if attempts >= 3:
            return JsonResponse({
                'success': False,
                'error': 'Too many signup attempts. Please try again later.'
            }, status=429)
        
        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Initialize user statistics
            UserStats.objects.create(user=user)
            
            # Auto-login after signup
            login(request, user)
            
            # Reset signup attempts
            cache.delete(cache_key)
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'date_joined': user.date_joined.isoformat()
                }
            })
            
        except Exception as e:
            # Increment failed attempts
            cache.set(cache_key, attempts + 1, 60 * 60)  # 1 hour
            
            error_msg = 'Registration failed'
            if 'username' in str(e).lower():
                error_msg = 'Username already exists'
            elif 'email' in str(e).lower():
                error_msg = 'Email already registered'
            
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=400)
    
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)


@csrf_protect
@require_http_methods(["GET", "POST"])
def login_view(request):
    """Handle user login"""
    if request.method == 'GET':
        if request.user.is_authenticated:
            return redirect('/')
        return render(request, 'accounts/login.html')
    
    # Handle POST request
    if request.content_type == 'application/json':
        return handle_ajax_login(request)
    
    # Handle form submission
    username = request.POST.get('username', '').strip()
    password = request.POST.get('password', '')
    
    # Rate limiting check
    cache_key = f'login_attempts_{request.META.get("REMOTE_ADDR")}'
    attempts = cache.get(cache_key, 0)
    
    if attempts >= 5:
        messages.error(request, 'Too many login attempts. Try again later.')
        return render(request, 'accounts/login.html')
    
    # Authenticate user
    user = authenticate(request, username=username, password=password)
    
    if user and user.is_active:
        # Reset login attempts
        cache.delete(cache_key)
        
        # Login user
        login(request, user)
        
        messages.success(request, f'Welcome back, {user.username}!')
        return redirect(request.GET.get('next', '/'))
    else:
        # Increment failed attempts
        cache.set(cache_key, attempts + 1, 60 * 15)  # 15 minutes
        
        messages.error(request, 'Invalid username or password')
        return render(request, 'accounts/login.html')


def handle_ajax_login(request):
    """Handle AJAX login requests"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Rate limiting check
        cache_key = f'login_attempts_{request.META.get("REMOTE_ADDR")}'
        attempts = cache.get(cache_key, 0)
        
        if attempts >= 5:
            return JsonResponse({
                'success': False,
                'error': 'Too many login attempts. Try again later.'
            }, status=429)
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user and user.is_active:
            # Reset login attempts
            cache.delete(cache_key)
            
            # Login user
            login(request, user)
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                }
            })
        else:
            # Increment failed attempts
            cache.set(cache_key, attempts + 1, 60 * 15)  # 15 minutes
            
            return JsonResponse({
                'success': False,
                'error': 'Invalid username or password'
            }, status=401)
    
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)


@require_http_methods(["POST"])
def logout_view(request):
    """Handle user logout"""
    if request.user.is_authenticated:
        username = request.user.username
        logout(request)
        
        if request.content_type == 'application/json':
            return JsonResponse({'success': True})
        
        messages.success(request, f'Goodbye, {username}!')
    
    return redirect('/')


@login_required
def profile_view(request):
    """User profile page"""
    from typing_test.models import TestSession
    
    user_stats, created = UserStats.objects.get_or_create(user=request.user)
    
    # Get recent tests
    recent_tests = TestSession.objects.filter(
        user=request.user, 
        completed=True
    ).order_by('-completed_at')[:5]
    
    context = {
        'user': request.user,
        'user_stats': user_stats,
        'recent_tests': recent_tests,
    }
    return render(request, 'accounts/profile.html', context)


def validate_signup_data(username, email, password, confirm_password):
    """Comprehensive server-side validation"""
    errors = []
    
    # Username validation
    if not username or len(username) < 3:
        errors.append('Username must be at least 3 characters long')
    if len(username) > 30:
        errors.append('Username cannot exceed 30 characters')
    if not username.replace('_', '').isalnum():
        errors.append('Username can only contain letters, numbers, and underscores')
    if User.objects.filter(username=username).exists():
        errors.append('Username already exists')
    
    # Email validation
    if not email:
        errors.append('Email is required')
    else:
        try:
            validate_email(email)
            if User.objects.filter(email=email).exists():
                errors.append('Email already registered')
        except ValidationError:
            errors.append('Invalid email format')
    
    # Password validation
    if not password:
        errors.append('Password is required')
    if len(password) < 8:
        errors.append('Password must be at least 8 characters long')
    if password != confirm_password:
        errors.append('Passwords do not match')
    
    # Password strength check
    if password and not is_strong_password(password):
        errors.append('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    
    return errors


def is_strong_password(password):
    """Check password strength"""
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_upper and has_lower and has_digit
