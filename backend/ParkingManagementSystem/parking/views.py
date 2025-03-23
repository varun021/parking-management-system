# parking/views.py
from django.db import models  # Add this import
from django.contrib.auth import get_user_model  # Add this import
import time
from django.utils import timezone

class PaymentError(Exception):
    """Custom exception for payment-related errors."""
    pass
from rest_framework import viewsets, permissions, generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
import qrcode
import io
from PIL import Image
from django.core.files.base import ContentFile
from django.conf import settings  # Add this import
from payments.fake_payment_client import FakePaymentClient  # Add this import
from payments.razorpay_client import RazorpayClient  # Add this import
from django.core.mail import send_mail

from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report, PINVerification
from .serializers import (
    ParkingLocationSerializer, ParkingSlotSerializer, BookingSerializer,
    PaymentSerializer, FeedbackSerializer, ReportSerializer
)
from .permissions import IsAdminUser

# Add these imports at the top of views.py
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ParkingLocation, ParkingSlot, Booking, Payment
from .serializers import BookingSerializer, PaymentSerializer
from .permissions import IsAdminUser

# Get the User model
User = get_user_model()

# Custom permission for admin users
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class ParkingLocationViewSet(viewsets.ModelViewSet):
    queryset = ParkingLocation.objects.all()
    serializer_class = ParkingLocationSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['name', 'address']
    search_fields = ['name', 'address']
    
    @action(detail=True, methods=['get'])
    def slots(self, request, pk=None):
        try:
            location = self.get_object()
            slots = ParkingSlot.objects.filter(location=location)
            serializer = ParkingSlotSerializer(slots, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ParkingSlotViewSet(viewsets.ModelViewSet):
    queryset = ParkingSlot.objects.all()
    serializer_class = ParkingSlotSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['location', 'is_occupied']
    
    def get_queryset(self):
        queryset = ParkingSlot.objects.all()
        location_id = self.request.query_params.get('location', None)
        if location_id:
            queryset = queryset.filter(location_id=location_id, is_occupied=False)
        return queryset

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check if slot is available for given time period"""
        try:
            slot = self.get_object()
            start_time = request.query_params.get('start_time')
            end_time = request.query_params.get('end_time')

            if not all([start_time, end_time]):
                raise ValidationError("Start time and end time are required")

            # Convert to datetime objects
            start_time = timezone.datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_time = timezone.datetime.fromisoformat(end_time.replace('Z', '+00:00'))

            # Check for overlapping bookings
            overlapping_bookings = Booking.objects.filter(
                slot=slot,
                status__in=['pending', 'confirmed', 'active'],
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()

            return Response({
                'available': not overlapping_bookings and not slot.is_occupied
            })
        except (ValidationError, ValueError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def verify_pin(self, request, pk=None):
        booking = self.get_object()
        pin = request.data.get('pin')
        verification_type = request.data.get('type')  # 'entry' or 'exit'

        if not pin or not verification_type:
            return Response({
                'error': 'PIN and verification type are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            if booking.verify_pin(pin, verification_type):
                # Record verification
                PINVerification.objects.create(
                    booking=booking,
                    verification_type=verification_type,
                    verified_by=request.user,
                    is_successful=True
                )

                # Send email notification
                self.send_verification_notification(booking, verification_type)

                return Response({
                    'success': True,
                    'message': f'PIN verification successful for {verification_type}',
                    'booking_status': booking.status,
                    'verified_time': (
                        booking.entry_time if verification_type == 'entry' 
                        else booking.exit_time
                    ).isoformat()
                })
            else:
                PINVerification.objects.create(
                    booking=booking,
                    verification_type=verification_type,
                    verified_by=request.user,
                    is_successful=False
                )
                return Response({
                    'error': 'Invalid PIN'
                }, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Verification failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def send_verification_notification(self, booking, verification_type):
        """Send email notification for entry/exit verification"""
        action_time = booking.entry_time if verification_type == 'entry' else booking.exit_time
        
        subject = f'Parking {verification_type.title()} Confirmed'
        message = f"""
            Dear {booking.user.get_full_name()},

            Your parking {verification_type} has been verified successfully.

            Booking Details:
            - Location: {booking.slot.location.name}
            - Slot: {booking.slot.slot_number}
            - {verification_type.title()} Time: {action_time.strftime('%Y-%m-%d %H:%M:%S')}
            
            {'Enjoy your parking!' if verification_type == 'entry' else 'Thank you for using our service!'}
        """
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [booking.user.email],
            fail_silently=True
        )

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(user=user)

    def get_payment_client(self):
        if settings.USE_FAKE_PAYMENT_CLIENT:
            return FakePaymentClient()
        return RazorpayClient()

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        try:
            booking_id = request.data.get('booking_id')
            booking = get_object_or_404(Booking, id=booking_id)
            payment_method = request.data.get('payment_method')
            amount = request.data.get('amount')

            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                user=request.user,
                amount=amount,
                payment_method=payment_method,
                status='pending',
                payment_id=f'PAY_{booking.id}_{int(time.time())}',
                order_id=f'ORDER_{booking.id}_{int(time.time())}',
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            return Response({
                'success': True,
                'payment_id': payment.payment_id,
                'order_id': payment.order_id,
                'amount': float(payment.amount),
                'booking_id': booking.id
            })
            
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Payment initiation failed'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def verify(self, request):
        try:
            payment_id = request.data.get('payment_id')
            order_id = request.data.get('order_id')
            booking_id = request.data.get('booking_id')

            if not all([payment_id, order_id]):
                raise ValidationError("Missing required payment verification fields")

            payment = get_object_or_404(Payment, order_id=order_id)
            booking = get_object_or_404(Booking, id=booking_id)
            
            # Add verification timestamp
            payment.verified_at = timezone.now()
            
            # For testing/development, assume payment is successful
            payment.status = 'success'
            payment.save()

            # Update booking status
            booking.status = 'confirmed'
            booking.save()

            return Response({
                'success': True,
                'payment_id': payment.payment_id,
                'booking_id': booking.id,
                'amount': float(payment.amount),
                'status': payment.status
            })
            
        except (Payment.DoesNotExist, Booking.DoesNotExist) as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        payment = self.get_object()

        if payment.status != 'success':
            return Response({"error": "Only successful payments can be refunded."}, status=status.HTTP_400_BAD_REQUEST)

        # Refund payment using the appropriate client
        client = self.get_payment_client()
        refund = client.refund_payment(payment.payment_id)

        if refund:
            payment.status = 'refunded'
            payment.save()
            return Response({"message": "Payment refunded successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Refund failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Feedback.objects.all()
        return Feedback.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def location(self, request):
        location_id = request.query_params.get('location_id')
        if not location_id:
            return Response({"error": "Location ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        feedbacks = Feedback.objects.filter(location_id=location_id)
        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)

from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            # Get current timestamp
            now = timezone.now()
            
            # Basic counts
            bookings = Booking.objects.all()
            total_bookings = bookings.count()
            active_bookings = bookings.filter(status='confirmed', 
                                            start_time__lte=now,
                                            end_time__gte=now).count()
            completed_bookings = bookings.filter(status='completed').count()
            cancelled_bookings = bookings.filter(status='cancelled').count()
            
            # Revenue calculations
            total_revenue = Payment.objects.filter(
                status='success'
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # User statistics
            total_users = User.objects.filter(role='customer').count()
            
            # Location and slot statistics
            total_locations = ParkingLocation.objects.count()
            parking_slots = ParkingSlot.objects.all()
            total_slots = parking_slots.count()
            occupied_slots = parking_slots.filter(is_occupied=True).count()
            
            # Recent bookings with detailed information
            recent_bookings = Booking.objects.select_related(
                'user', 'slot', 'slot__location'
            ).order_by('-created_at')[:5]
            
            recent_bookings_data = [{
                'id': booking.id,
                'user': booking.user.username,
                'slot_number': booking.slot.slot_number,
                'location_name': booking.slot.location.name,
                'start_time': booking.start_time,
                'end_time': booking.end_time,
                'amount': str(booking.amount),
                'status': booking.status
            } for booking in recent_bookings]
            
            # Recent payments with details
            recent_payments = Payment.objects.select_related(
                'booking', 'user'
            ).order_by('-created_at')[:5]
            
            recent_payments_data = [{
                'id': payment.id,
                'payment_id': payment.payment_id,
                'user': payment.user.username,
                'amount': str(payment.amount),
                'status': payment.status,
                'payment_method': payment.payment_method,
                'created_at': payment.created_at
            } for payment in recent_payments]
            
            # Period comparisons (e.g., today vs yesterday)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday_start = today_start - timedelta(days=1)
            
            today_bookings = bookings.filter(created_at__gte=today_start).count()
            yesterday_bookings = bookings.filter(
                created_at__gte=yesterday_start,
                created_at__lt=today_start
            ).count()
            
            today_revenue = Payment.objects.filter(
                status='success',
                created_at__gte=today_start
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            return Response({
                # Basic statistics
                "total_bookings": total_bookings,
                "active_bookings": active_bookings,
                "completed_bookings": completed_bookings,
                "cancelled_bookings": cancelled_bookings,
                "total_revenue": float(total_revenue),
                "total_users": total_users,
                "total_locations": total_locations,
                "total_slots": total_slots,
                "occupied_slots": occupied_slots,
                
                # Recent data
                "recent_bookings": recent_bookings_data,
                "recent_payments": recent_payments_data,
                
                # Comparative statistics
                "today_bookings": today_bookings,
                "yesterday_bookings": yesterday_bookings,
                "today_revenue": float(today_revenue),
                
                # Additional metrics
                "occupancy_rate": round((occupied_slots / total_slots * 100), 2) if total_slots > 0 else 0,
                "available_slots": total_slots - occupied_slots,
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminReportView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request, report_type=None):
        try:
            report_type = report_type or request.query_params.get('type', 'daily')
            date_range = request.query_params.get('range', 'week')
            
            # Get date range based on report type
            now = timezone.now()
            if date_range == 'week':
                start_date = now - timedelta(days=7)
            elif date_range == 'month':
                start_date = now - timedelta(days=30)
            elif date_range == 'year':
                start_date = now - timedelta(days=365)
            else:
                start_date = now - timedelta(days=7)  # Default to week
            
            # Get data based on report type
            if report_type == 'overview':
                data = self.get_overview_data(start_date)
            elif report_type == 'revenue':
                data = self.get_revenue_data(start_date)
            elif report_type == 'bookings':
                data = self.get_bookings_data(start_date)
            elif report_type == 'users':
                data = self.get_users_data(start_date)
            else:
                return Response({"error": "Invalid report type."}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(data)
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_overview_data(self, start_date):
        """Get overview report data"""
        now = timezone.now()
        
        # Get bookings data
        bookings = Booking.objects.filter(created_at__gte=start_date)
        bookings_data = (
            bookings.annotate(date=models.functions.TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Get revenue data
        revenue_data = (
            Payment.objects.filter(
                created_at__gte=start_date,
                status='success'
            )
            .annotate(date=models.functions.TruncDate('created_at'))
            .values('date')
            .annotate(amount=Sum('amount'))
            .order_by('date')
        )
        
        return {
            'bookings': list(bookings_data),
            'revenue': list(revenue_data),
            'summary': {
                'total_bookings': bookings.count(),
                'total_revenue': Payment.objects.filter(
                    created_at__gte=start_date,
                    status='success'
                ).aggregate(total=Sum('amount'))['total'] or 0,
            }
        }

    def get_revenue_data(self, start_date):
        """Get revenue report data"""
        revenue_data = (
            Payment.objects.filter(
                created_at__gte=start_date,
                status='success'
            )
            .annotate(date=models.functions.TruncDate('created_at'))
            .values('date')
            .annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            .order_by('date')
        )
        
        return {
            'revenue_by_date': list(revenue_data),
            'payment_methods': list(
                Payment.objects.filter(
                    created_at__gte=start_date,
                    status='success'
                )
                .values('payment_method')
                .annotate(
                    total=Sum('amount'),
                    count=Count('id')
                )
            )
        }

    def get_bookings_data(self, start_date):
        """Get bookings report data"""
        bookings_data = (
            Booking.objects.filter(created_at__gte=start_date)
            .annotate(date=models.functions.TruncDate('created_at'))
            .values('date')
            .annotate(
                count=Count('id'),
                revenue=Sum('amount')
            )
            .order_by('date')
        )
        
        return {
            'bookings_by_date': list(bookings_data),
            'status_distribution': list(
                Booking.objects.filter(created_at__gte=start_date)
                .values('status')
                .annotate(count=Count('id'))
            )
        }

    def get_users_data(self, start_date):
        """Get users report data"""
        User = get_user_model()
        
        return {
            'new_users': list(
                User.objects.filter(date_joined__gte=start_date)
                .annotate(date=models.functions.TruncDate('date_joined'))
                .values('date')
                .annotate(count=Count('id'))
                .order_by('date')
            ),
            'role_distribution': list(
                User.objects.values('role')
                .annotate(count=Count('id'))
            ),
            'booking_distribution': list(
                Booking.objects.filter(created_at__gte=start_date)
                .values('user__username')
                .annotate(
                    booking_count=Count('id'),
                    total_spent=Sum('amount')
                )
                .order_by('-booking_count')[:10]
            )
        }