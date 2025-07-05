from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from typing_test.models import TestSession
import json


def leaderboard_view(request):
    """Leaderboard page"""
    return render(request, 'leaderboard/index.html')


@cache_page(60 * 5)  # Cache for 5 minutes
@require_http_methods(["GET"])
def get_leaderboard_api(request):
    """Minimal leaderboard endpoint - client does most of the work"""
    duration = int(request.GET.get('duration', 30))
    
    # Only return essential data
    top_sessions = TestSession.objects.filter(
        duration=duration,
        completed=True
    ).select_related('user').order_by('-wpm')[:50]
    
    leaderboard = []
    for session in top_sessions:
        # Calculate composite score server-side for consistency
        score = int((session.wpm * 0.7) + (session.accuracy * 0.3))
        
        username = session.user.username if session.user else f"Guest-{session.session_key[:8]}"
        
        leaderboard.append({
            'username': username,
            'wpm': session.wpm,
            'accuracy': session.accuracy,
            'score': score
        })
    
    # Sort by composite score
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    
    return JsonResponse({
        'leaderboard': leaderboard[:50],  # Top 50 only
        'timestamp': timezone.now().isoformat(),
        'cache_duration': 300  # 5 minutes
    })


@require_http_methods(["POST"])
def batch_update_leaderboard(request):
    """Batch process leaderboard updates to minimize server load"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        data = json.loads(request.body)
        sessions = data.get('sessions', [])
        
        # Process only valid sessions
        processed = 0
        for session_data in sessions:
            if validate_session_data(session_data):
                # Update leaderboard logic here
                processed += 1
        
        return JsonResponse({
            'success': True,
            'processed': processed
        })
        
    except Exception as e:
        return JsonResponse({'error': 'Processing failed'}, status=400)


def validate_session_data(data):
    """Basic validation for leaderboard data"""
    return (
        0 <= data.get('wpm', 0) <= 300 and
        0 <= data.get('accuracy', 0) <= 100 and
        data.get('duration') in [15, 30, 60]
    )
