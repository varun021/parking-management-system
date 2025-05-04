# parking/serializers.py
from rest_framework import serializers
from django.core.mail import send_mail
from django.conf import settings
from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report, Subscription
from decimal import Decimal


class ParkingLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingLocation
        fields = ['id', 'name', 'address', 'total_slots', 'available_slots']


class ParkingSlotSerializer(serializers.ModelSerializer):
    location_name = serializers.ReadOnlyField(source='location.name')
    
    class Meta:
        model = ParkingSlot
        fields = ['id', 'location', 'location_name', 'slot_number', 'is_occupied']


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    slot_number = serializers.SerializerMethodField()
    location_name = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'slot', 'slot_number', 'location_name', 
            'start_time', 'end_time', 'amount', 'total_amount', 'status',
            'created_at', 'pin', 'entry_time', 'exit_time'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'pin', 'entry_time', 'exit_time']

    def get_slot_number(self, obj):
        return obj.slot.slot_number if obj.slot else None

    def get_location_name(self, obj):
        return obj.slot.location.name if obj.slot else None

    def validate(self, attrs):
        # Check if slot is available for the requested time period
        slot = attrs['slot']
        start_time = attrs['start_time']
        end_time = attrs['end_time']

        if start_time >= end_time:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})

        # Check if slot is already booked for the requested time
        existing_bookings = Booking.objects.filter(
            slot=slot,
            status__in=['pending', 'confirmed'],
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        if existing_bookings:
            raise serializers.ValidationError({"slot": "This slot is already booked for the requested time period."})

        return attrs

    def create(self, validated_data):
        booking = super().create(validated_data)
        # Generate PIN after booking is created
        booking.generate_pin()
        # Send PIN to customer
        self.send_pin_notification(booking)
        return booking

    def send_pin_notification(self, booking):
        subject = 'Your Parking Booking PIN'
        message = f"""
            Dear {booking.user.get_full_name()},

            Your parking booking has been confirmed. Here are your booking details:

            Location: {booking.slot.location.name}
            Slot: {booking.slot.slot_number}
            Start Time: {booking.start_time.strftime('%Y-%m-%d %H:%M:%S')}
            End Time: {booking.end_time.strftime('%Y-%m-%d %H:%M:%S')}

            Your PIN for entry and exit: {booking.pin}

            Please keep this PIN handy as you will need it for both entering and exiting the parking facility.

            Thank you for using our service!
        """
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [booking.user.email],
            fail_silently=True,
        )


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'booking', 'user', 'payment_id', 'transaction_id', 'amount', 'status', 'payment_method', 'created_at']
        read_only_fields = ['id', 'created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'username', 'location', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    admin = serializers.HiddenField(default=serializers.CurrentUserDefault())
    admin_username = serializers.ReadOnlyField(source='admin.username')

    class Meta:
        model = Report
        fields = ['id', 'admin', 'admin_username', 'generated_at', 'report_type', 'total_bookings', 'total_revenue']
        read_only_fields = ['id', 'generated_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    username = serializers.ReadOnlyField(source='user.username')
    location_name = serializers.ReadOnlyField(source='location.name')
    slot_number = serializers.ReadOnlyField(source='slot.slot_number')
    end_date = serializers.DateField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'username', 'location', 'location_name', 
            'slot', 'slot_number', 'duration', 'start_date', 
            'end_date', 'amount', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'end_date', 'amount']