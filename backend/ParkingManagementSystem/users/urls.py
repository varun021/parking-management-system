# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, RequestOTPView, VerifyOTPView, 
    LogoutView, ProfileView, UpdateProfileView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', RequestOTPView.as_view(), name='login'),
    path('auth/otp/verify/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/profile/update/', UpdateProfileView.as_view(), name='update-profile'),
]
