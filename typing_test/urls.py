from django.urls import path
from . import views

app_name = 'typing_test'

urlpatterns = [
    path('', views.typing_test, name='index'),
    path('api/text/', views.get_test_text, name='get_text'),
    path('api/start/', views.start_test_session, name='start_session'),
    path('api/complete/', views.complete_test_session, name='complete_session'),
]