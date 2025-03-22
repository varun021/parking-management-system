# parking/serializers.py
from rest_framework import serializers
from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report


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
    slot_number = serializers.ReadOnlyField(source='slot.slot_number')
    location_name = serializers.ReadOnlyField(source='slot.location.name')

    class Meta:
        model = Booking
        fields = ['id', 'user', 'slot', 'slot_number', 'location_name', 'start_time', 'end_time', 'amount', 'status', 'qr_code']
        read_only_fields = ['id', 'status', 'qr_code']

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