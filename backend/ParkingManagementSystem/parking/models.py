from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User

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

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"

# Payment Model
class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('upi', 'UPI'),
        ('net_banking', 'Net Banking'),
        ('wallet', 'Wallet'),
    )
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.CharField(max_length=100, unique=True)
    order_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_details = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.payment_id} for Booking {self.booking.id}"


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
