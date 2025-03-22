# parking/views.py
from django.db import models  # Add this import
from django.contrib.auth import get_user_model  # Add this import
from rest_framework import viewsets, permissions, generics, status, filters
import razorpay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
import qrcode
import io
from PIL import Image
from django.core.files.base import ContentFile
from django.conf import settings  # Add this import
from payments.fake_payment_client import FakePaymentClient  # Add this import
from payments.razorpay_client import RazorpayClient  # Add this import

from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report
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

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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
            booking = Booking.objects.get(id=booking_id)
            
            # Generate a unique order ID
            order_id = f'ORDER_{booking.id}_{timezone.now().timestamp()}'
            
            # Create payment object
            payment = Payment.objects.create(
                booking=booking,
                user=request.user,
                amount=booking.total_amount or booking.amount,
                status='pending',
                payment_method=request.data.get('payment_method', 'fake_payment'),
                order_id=order_id,
                payment_id=f'PAYMENT_{order_id}'
            )

            return Response({
                'order_id': order_id,
                'amount': float(payment.amount),
                'currency': 'INR',
                'payment_details': {
                    'duration_hours': float(booking.duration_hours),
                    'rate_per_hour': float(booking.RATE_PER_HOUR),
                    'calculated_amount': float(payment.amount)
                }
            })

        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def verify(self, request):
        try:
            payment_id = request.data.get('payment_id')
            order_id = request.data.get('order_id')
            
            # Find payment by order_id instead of payment_id for fake payments
            payment = Payment.objects.get(order_id=order_id)
            booking = payment.booking
            
            # For fake payments, always verify as true
            payment.status = 'success'
            payment.payment_id = payment_id
            payment.save()
            
            # Update booking status
            booking.status = 'confirmed'
            booking.save()
            
            # Update slot status
            if booking.slot:
                booking.slot.is_occupied = True
                booking.slot.save()
            
            return Response({
                'success': True,
                'booking_id': booking.id,
                'payment_id': payment.payment_id
            })
                
        except Payment.DoesNotExist:
            return Response({
                'success': False,
                'error': "Payment not found for this order"
            }, status=status.HTTP_400_BAD_REQUEST)
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
    
    def get(self, request):
        report_type = request.query_params.get('type', 'daily')
        
        # Get date range based on report type
        now = timezone.now()
        if report_type == 'daily':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timezone.timedelta(days=1)
        elif report_type == 'weekly':
            start_date = now - timezone.timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timezone.timedelta(days=7)
        elif report_type == 'monthly':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_date = now.replace(year=now.year+1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                end_date = now.replace(month=now.month+1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            return Response({"error": "Invalid report type."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get bookings within date range
        bookings = Booking.objects.filter(start_time__gte=start_date, start_time__lt=end_date)
        total_bookings = bookings.count()
        
        # Get revenue
        payments = Payment.objects.filter(booking__in=bookings, status='success')
        total_revenue = payments.aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Create report
        report = Report.objects.create(
            admin=request.user,
            report_type=report_type,
            total_bookings=total_bookings,
            total_revenue=total_revenue
        )
        
        # Return report data
        return Response({
            "report_id": report.id,
            "report_type": report_type,
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "generated_at": report.generated_at
        })