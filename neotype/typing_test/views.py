from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.cache import cache
import json
import random
from .models import TestSession, UserStats, TextContent
from accounts.models import User


def home_view(request):
    """
    Home page with typing test interface.
    """
    # Get user stats if authenticated
    user_stats = None
    if request.user.is_authenticated:
        user_stats, created = UserStats.objects.get_or_create(user=request.user)
    
    context = {
        'user_stats': user_stats,
    }
    return render(request, 'typing_test/home.html', context)


def typing_test(request):
    """
    Render the typing test page.
    """
    return render(request, 'typing_test.html')


@require_http_methods(["GET"])
def get_test_text(request):
    """
    Generate or retrieve text for typing test.
    """
    duration = int(request.GET.get('duration', 30))
    difficulty = request.GET.get('difficulty', 'medium')
    
    # Try to get from database first
    text_content = TextContent.objects.filter(
        difficulty=difficulty,
        is_active=True
    ).order_by('?').first()
    
    if text_content:
        content = text_content.content
        # Adjust content length based on duration
        words = content.split()
        target_words = duration * 2  # Rough estimate: 2 words per second for average typing
        if len(words) > target_words:
            content = ' '.join(words[:target_words])
    else:
        # Fallback: generate text client-side style
        content = generate_fallback_text(difficulty, duration)
    
    return JsonResponse({
        'text': content,
        'word_count': len(content.split()),
        'character_count': len(content),
        'difficulty': difficulty,
        'duration': duration
    })


@csrf_protect
@require_http_methods(["POST"])
def start_test_session(request):
    """
    Start a new typing test session.
    """
    try:
        data = json.loads(request.body)
        duration = int(data.get('duration', 30))
        text_content = data.get('text_content', '')
        
        if not text_content:
            return JsonResponse({'error': 'Text content required'}, status=400)
        
        # Create test session
        session = TestSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key if not request.user.is_authenticated else None,
            duration=duration,
            text_content=text_content,
            typed_text='',  # Will be updated when completed
            wpm=0,
            accuracy=0,
            typing_time=0,
            completed=False
        )
        
        return JsonResponse({
            'session_id': session.id,
            'text': text_content,
            'duration': duration,
            'started_at': session.started_at.isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Failed to start session'}, status=500)


@csrf_protect
@require_http_methods(["POST"])
def complete_test_session(request):
    """
    Complete a typing test session and calculate results.
    """
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        typed_text = data.get('typed_text', '')
        actual_time = float(data.get('actual_time', 0))
        focus_lost_count = int(data.get('focus_lost_count', 0))
        suspicious_events = data.get('suspicious_events', [])
        
        # Get the session
        session = get_object_or_404(TestSession, id=session_id)
        
        # Verify session ownership
        if request.user.is_authenticated:
            if session.user != request.user:
                return JsonResponse({'error': 'Unauthorized'}, status=403)
        else:
            if session.session_key != request.session.session_key:
                return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        # Calculate metrics
        original_text = session.text_content
        metrics = calculate_typing_metrics(original_text, typed_text, actual_time)
        
        # Update session
        session.typed_text = typed_text
        session.wpm = metrics['wpm']
        session.accuracy = metrics['accuracy']
        session.typing_time = actual_time
        session.correct_chars = metrics['correct_chars']
        session.incorrect_chars = metrics['incorrect_chars']
        session.total_chars = metrics['total_chars']
        session.focus_lost_count = focus_lost_count
        session.suspicious_events = suspicious_events
        session.completed = True
        session.completed_at = timezone.now()
        session.save()
        
        # Update user stats if authenticated
        is_new_record = False
        if request.user.is_authenticated:
            user_stats, created = UserStats.objects.get_or_create(user=request.user)
            is_new_record = check_personal_record(user_stats, session)
            user_stats.update_stats_from_session(session)
        
        return JsonResponse({
            'success': True,
            'session': {
                'id': session.id,
                'wpm': session.wpm,
                'accuracy': session.accuracy,
                'typing_time': session.typing_time,
                'correct_chars': session.correct_chars,
                'incorrect_chars': session.incorrect_chars,
                'total_chars': session.total_chars,
            },
            'is_new_record': is_new_record,
            'metrics': metrics
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Failed to complete session: {str(e)}'}, status=500)


def calculate_typing_metrics(original_text, typed_text, time_seconds):
    """
    Calculate WPM, accuracy, and other typing metrics.
    """
    if time_seconds == 0:
        return {
            'wpm': 0,
            'accuracy': 0,
            'correct_chars': 0,
            'incorrect_chars': 0,
            'total_chars': 0
        }
    
    # Character-level analysis
    correct_chars = 0
    incorrect_chars = 0
    total_chars = len(typed_text)
    
    # Compare character by character
    min_length = min(len(original_text), len(typed_text))
    for i in range(min_length):
        if original_text[i] == typed_text[i]:
            correct_chars += 1
        else:
            incorrect_chars += 1
    
    # Count missing characters as incorrect
    if len(typed_text) < len(original_text):
        incorrect_chars += len(original_text) - len(typed_text)
    
    # Calculate accuracy
    if len(original_text) > 0:
        accuracy = (correct_chars / len(original_text)) * 100
    else:
        accuracy = 0
    
    # Calculate WPM (words per minute)
    # Standard: 5 characters = 1 word
    words_typed = total_chars / 5
    minutes = time_seconds / 60
    wpm = words_typed / minutes if minutes > 0 else 0
    
    # Adjust WPM based on accuracy (common practice)
    adjusted_wpm = wpm * (accuracy / 100)
    
    return {
        'wpm': round(adjusted_wpm, 2),
        'accuracy': round(accuracy, 2),
        'correct_chars': correct_chars,
        'incorrect_chars': incorrect_chars,
        'total_chars': total_chars,
        'raw_wpm': round(wpm, 2)
    }


def check_personal_record(user_stats, session):
    """
    Check if this session is a new personal record.
    """
    duration_field = f'best_wpm_{session.duration}s'
    current_best = getattr(user_stats, duration_field, None)
    
    if current_best is None or session.wpm > current_best:
        return True
    
    return False


def generate_fallback_text(difficulty='medium', duration=30):
    """
    Generate text content for typing tests as fallback.
    """
    word_lists = {
        'easy': ['the', 'and', 'for', 'you', 'are', 'with', 'this', 'that', 'have', 'from', 
                'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when'],
        'medium': ['people', 'about', 'would', 'could', 'there', 'their', 'think', 'where', 'being', 'right',
                  'before', 'after', 'should', 'through', 'during', 'follow', 'around', 'between', 'without', 'something'],
        'hard': ['government', 'development', 'management', 'information', 'environment', 'community', 'university', 'technology', 'opportunity', 'experience',
                'achievement', 'responsibility', 'understanding', 'communication', 'organization', 'relationship', 'professional', 'international', 'contemporary', 'perspective']
    }
    
    words = word_lists.get(difficulty, word_lists['medium'])
    target_words = max(20, duration * 2)  # At least 20 words, or 2 per second
    
    # Generate text
    text_words = []
    for _ in range(target_words):
        text_words.append(random.choice(words))
    
    return ' '.join(text_words)