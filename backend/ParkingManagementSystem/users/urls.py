# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, RequestOTPView, VerifyOTPView, 
    LogoutView, ProfileView, UpdateProfileView,
    AdminUserListView, AdminUserDetailView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', RequestOTPView.as_view(), name='login'),
    path('auth/otp/verify/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('parking/admin/users/', AdminUserListView.as_view(), name='admin-users-list'),
    path('parking/admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('parking/admin/users/<int:pk>/update/', AdminUserDetailView.as_view(), name='admin-user-update'),
    path('parking/admin/users/<int:pk>/delete/', AdminUserDetailView.as_view(), name='admin-user-delete'),
]
