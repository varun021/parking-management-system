from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from decimal import Decimal
import random
import string
from django.utils import timezone

# Create your models here.
# Parking Location Model
class ParkingLocation(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    total_slots = models.IntegerField()

    @property
    def available_slots(self):
        return self.total_slots - self.slots.filter(is_occupied=True).count()


# Parking Slot Model
class ParkingSlot(models.Model):
    location = models.ForeignKey(ParkingLocation, on_delete=models.CASCADE, related_name="slots")
    slot_number = models.CharField(max_length=10)
    is_occupied = models.BooleanField(default=False)

    class Meta:
        unique_together = ('location', 'slot_number')


# Booking Model
class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    slot = models.ForeignKey(ParkingSlot, on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ], default='pending')

    qr_code = models.ImageField(upload_to="qr_codes/", null=True, blank=True)  # QR Code for Entry
    created_at = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pin = models.CharField(max_length=6, null=True, blank=True)
    entry_time = models.DateTimeField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)

    RATE_PER_HOUR = Decimal('50.00')  # Add this constant
    
    @property
    def duration_hours(self):
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            return Decimal(str(duration.total_seconds() / 3600))
        return Decimal('0')

    @property
    def calculated_amount(self):
        return self.duration_hours * self.RATE_PER_HOUR

    def save(self, *args, **kwargs):
        if not self.amount:
            self.amount = self.calculated_amount
        if not self.total_amount:
            self.total_amount = self.amount
        super().save(*args, **kwargs)

    def generate_pin(self):
        """Generate a random 6-digit PIN"""
        if not self.pin:  # Only generate if not already exists
            self.pin = ''.join(random.choices(string.digits, k=6))
            self.save()
        return self.pin

    def verify_pin(self, provided_pin, verification_type):
        """
        Verify PIN and update booking status
        verification_type: 'entry' or 'exit'
        """
        if self.pin != provided_pin:
            return False

        now = timezone.now()
        if verification_type == 'entry':
            if self.entry_time:
                raise ValidationError("Entry already verified")
            self.entry_time = now
            self.status = 'active'
            self.slot.is_occupied = True
            self.slot.save()
        elif verification_type == 'exit':
            if not self.entry_time:
                raise ValidationError("Entry must be verified first")
            if self.exit_time:
                raise ValidationError("Exit already verified")
            self.exit_time = now
            self.status = 'completed'
            self.slot.is_occupied = False
            self.slot.save()

        self.save()
        return True

    def send_pin_notification(self):
        """Send PIN to customer via email"""
        subject = 'Your Parking Booking PIN'
        message = f"""
            Dear {self.user.get_full_name()},

            Your parking booking (ID: {self.id}) has been confirmed.

            Booking Details:
            - Location: {self.slot.location.name}
            - Slot: {self.slot.slot_number}
            - Start Time: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}
            - End Time: {self.end_time.strftime('%Y-%m-%d %H:%M:%S')}

            Your PIN for entry and exit: {self.pin}

            Please keep this PIN secure. You'll need it for:
            1. Entry verification at the start of your booking
            2. Exit verification when leaving

            Thank you for using our service!
        """
        send_mail(subject, message, settings.EMAIL_HOST_USER, [self.user.email], fail_silently=True)

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"

    class Meta:
        ordering = ['-created_at']


class PINVerification(models.Model):
    VERIFICATION_TYPE_CHOICES = [
        ('entry', 'Entry'),
        ('exit', 'Exit'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='pin_verifications')
    verification_type = models.CharField(max_length=10, choices=VERIFICATION_TYPE_CHOICES)
    verified_at = models.DateTimeField(auto_now_add=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pin_verifications')
    is_successful = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.verification_type} verification for Booking {self.booking.id}"


# Payment Model
class Payment(models.Model):
    # Add payment method choices
    PAYMENT_METHOD_CHOICES = (
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('wallet', 'Digital Wallet')
    )
    
    # Add status choices
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded')
    )
    
    # Add additional fields
    status_updated_at = models.DateTimeField(null=True)
    status_notes = models.TextField(null=True, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    payment_gateway_response = models.JSONField(null=True, blank=True)

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.CharField(max_length=100, unique=True)
    order_id = models.CharField(max_length=100, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def update_status(self, new_status, notes=None):
        self.status = new_status
        self.status_updated_at = timezone.now()
        if notes:
            self.status_notes = notes
        self.save()


# Feedback Model
class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    location = models.ForeignKey(ParkingLocation, on_delete=models.CASCADE, related_name="feedbacks")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])  # 1-5 Stars
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# Reports Model (Admin Only)
class Report(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    report_type = models.CharField(max_length=50, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ])
    total_bookings = models.IntegerField()
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.report_type} Report - {self.generated_at}"


class Subscription(models.Model):
    DURATION_CHOICES = (
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    location = models.ForeignKey(ParkingLocation, on_delete=models.CASCADE)
    slot = models.ForeignKey(ParkingSlot, on_delete=models.CASCADE)
    duration = models.CharField(max_length=10, choices=DURATION_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s {self.duration} subscription"
