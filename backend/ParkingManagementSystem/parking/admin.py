from django.contrib import admin
from .models import ParkingLocation, ParkingSlot, Booking, Payment, Feedback, Report

@admin.register(ParkingLocation)
class ParkingLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'total_slots', 'available_slots')
    search_fields = ('name', 'address')
    list_filter = ('total_slots',)

@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display = ('slot_number', 'location', 'is_occupied')
    list_filter = ('location', 'is_occupied')
    search_fields = ('slot_number',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'slot', 'start_time', 'end_time', 'amount', 'status')
    list_filter = ('status', 'start_time', 'end_time')
    search_fields = ('user__username', 'slot__slot_number')
    readonly_fields = ('qr_code',)
    date_hierarchy = 'start_time'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'booking', 'user', 'amount', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('payment_id', 'user__username', 'booking__id')
    readonly_fields = ('created_at',)  # Ensure only valid fields are included
    date_hierarchy = 'created_at'

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'location', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'location__name')
    readonly_fields = ('created_at',)

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('admin', 'report_type', 'total_bookings', 'total_revenue', 'generated_at')
    list_filter = ('report_type', 'generated_at')
    search_fields = ('admin__username',)
    readonly_fields = ('generated_at',)
    date_hierarchy = 'generated_at'
