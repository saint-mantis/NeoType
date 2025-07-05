from django.urls import path
from . import views

app_name = 'leaderboard'

urlpatterns = [
    path('', views.leaderboard_view, name='index'),
    path('api/', views.get_leaderboard_api, name='api'),
    path('api/batch-update/', views.batch_update_leaderboard, name='batch_update'),
]