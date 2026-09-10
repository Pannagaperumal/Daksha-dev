from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LawyerUserViewSet, UserRegistrationView, LoginView

router = DefaultRouter()
router.register(r'users', LawyerUserViewSet, basename='lawyeruser')

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('', include(router.urls)),
]
