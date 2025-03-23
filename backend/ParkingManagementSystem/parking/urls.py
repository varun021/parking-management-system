# parking/urls.py (continued)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParkingLocationViewSet, ParkingSlotViewSet, BookingViewSet,
    PaymentViewSet, FeedbackViewSet, AdminDashboardView, AdminReportView
)

router = DefaultRouter()
router.register('locations', ParkingLocationViewSet)
router.register('slots', ParkingSlotViewSet)
router.register('bookings', BookingViewSet, basename='booking')
router.register('payments', PaymentViewSet)
router.register('feedbacks', FeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/reports/', AdminReportView.as_view(), name='admin-reports'),
    path('payments/initiate/', PaymentViewSet.as_view({'post': 'initiate'}), name='initiate-payment'),
    path('payments/verify/', PaymentViewSet.as_view({'post': 'verify'}), name='verify-payment'),
    path('payments/<int:pk>/refund/', PaymentViewSet.as_view({'post': 'refund'}), name='refund-payment'),
    path('bookings/<int:pk>/verify-pin/', BookingViewSet.as_view({'post': 'verify_pin'}), name='verify-pin'),
    path('admin/reports/<str:report_type>/', AdminReportView.as_view(), name='admin-reports-type'),
]
