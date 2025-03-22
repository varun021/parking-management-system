# parking/views.py
from rest_framework import viewsets, permissions, generics, status, filters
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

from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report
from .serializers import (
    ParkingLocationSerializer, ParkingSlotSerializer, BookingSerializer,
    PaymentSerializer, FeedbackSerializer, ReportSerializer
)
from .permissions import IsAdminUser

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
        location = self.get_object()
        slots = ParkingSlot.objects.filter(location=location)
        serializer = ParkingSlotSerializer(slots, many=True)
        return Response(serializer.data)

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
            queryset = queryset.filter(location_id=location_id)
        return queryset

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'slot']
    ordering_fields = ['start_time', 'end_time', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        booking = serializer.save()
        self.generate_qr_code(booking)
        # Mark slot as occupied
        slot = booking.slot
        slot.is_occupied = True
        slot.save()

        # Update available slots count
        location = slot.location
        location.available_slots = location.total_slots - ParkingSlot.objects.filter(location=location, is_occupied=True).count()
        location.save()

    def generate_qr_code(self, booking):
        # Generate QR code with booking details
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )

        qr_data = f"Booking ID: {booking.id}\nUser: {booking.user.username}\nSlot: {booking.slot.slot_number}\nLocation: {booking.slot.location.name}\nStart: {booking.start_time}\nEnd: {booking.end_time}"
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Save QR code to booking
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        filename = f"booking_{booking.id}.png"

        booking.qr_code.save(filename, ContentFile(buffer.getvalue()), save=True)

    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        booking = self.get_object()

        # Check if booking can be cancelled
        now = timezone.now()

        if booking.status == 'cancelled':
            return Response({"error": "This booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        if booking.status == 'completed':
            return Response({"error": "Completed bookings cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        if booking.start_time < now:
            return Response({"error": "Cannot cancel a booking that has already started."}, status=status.HTTP_400_BAD_REQUEST)

        # Update booking status
        booking.status = 'cancelled'
        booking.save()

        # Free up the slot
        slot = booking.slot
        slot.is_occupied = False
        slot.save()

        # Update available slots count
        location = slot.location
        location.available_slots = location.total_slots - ParkingSlot.objects.filter(location=location, is_occupied=True).count()
        location.save()

        # Process refund if payment exists
        try:
            payment = Payment.objects.get(booking=booking)
            payment.status = 'refunded'
            payment.save()
        except Payment.DoesNotExist:
            pass

        return Response({"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def qrcode(self, request, pk=None):
        booking = self.get_object()

        if not booking.qr_code:
            self.generate_qr_code(booking)
            booking.refresh_from_db()

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(user=user)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        payment = self.get_object()
        return Response({
            "status": payment.status,
            "message": f"Payment {payment.status}"
        })

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        booking_id = request.data.get('booking_id')
        payment_method = request.data.get('payment_method')

        if not booking_id or not payment_method:
            return Response({"error": "Booking ID and payment method are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if payment already exists
        if Payment.objects.filter(booking=booking).exists():
            return Response({"error": "Payment already exists for this booking."}, status=status.HTTP_400_BAD_REQUEST)

        # Create payment object
        payment = Payment.objects.create(
            booking=booking,
            user=request.user,
            payment_id=f"PAY-{booking.id}-{int(timezone.now().timestamp())}",
            amount=booking.amount,
            payment_method=payment_method,
            status='pending'
        )

        # Integrate with Razorpay to create an order
        razorpay_client = RazorpayClient()
        order = razorpay_client.create_order(amount=booking.amount, receipt=f"order_rcptid_{booking.id}")

        payment.order_id = order['id']
        payment.save()

        return Response({
            "payment_id": payment.payment_id,
            "order_id": order['id'],
            "amount": payment.amount,
            "booking_id": booking.id,
            "message": "Payment initiated. Complete the payment to confirm your booking."
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def verify(self, request):
        payment_id = request.data.get('payment_id')
        order_id = request.data.get('order_id')
        signature = request.data.get('signature')

        if not payment_id or not order_id or not signature:
            return Response({"error": "Payment ID, Order ID, and Signature are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(payment_id=payment_id, order_id=order_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Verify payment with Razorpay
        razorpay_client = RazorpayClient()
        if razorpay_client.verify_payment(payment_id, order_id, signature):
            payment.status = 'success'
            payment.save()

            # Update booking status
            booking = payment.booking
            booking.status = 'confirmed'
            booking.save()

            return Response({"message": "Payment verified successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        payment = self.get_object()

        if payment.status != 'success':
            return Response({"error": "Only successful payments can be refunded."}, status=status.HTTP_400_BAD_REQUEST)

        # Refund payment using Razorpay
        razorpay_client = RazorpayClient()
        refund = razorpay_client.refund_payment(payment.payment_id)

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

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get counts and stats for dashboard
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(status='confirmed').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        cancelled_bookings = Booking.objects.filter(status='cancelled').count()
        
        total_revenue = Payment.objects.filter(status='success').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        total_users = User.objects.filter(role='customer').count()
        total_locations = ParkingLocation.objects.count()
        total_slots = ParkingSlot.objects.count()
        occupied_slots = ParkingSlot.objects.filter(is_occupied=True).count()
        
        # Get recent bookings
        recent_bookings = Booking.objects.all().order_by('-start_time')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data
        
        # Get recent payments
        recent_payments = Payment.objects.all().order_by('-created_at')[:5]
        recent_payments_data = PaymentSerializer(recent_payments, many=True).data
        
        return Response({
            "total_bookings": total_bookings,
            "active_bookings": active_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_revenue": total_revenue,
            "total_users": total_users,
            "total_locations": total_locations,
            "total_slots": total_slots,
            "occupied_slots": occupied_slots,
            "recent_bookings": recent_bookings_data,
            "recent_payments": recent_payments_data
        })

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