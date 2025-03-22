from django.contrib.auth.models import AbstractUser
from django.db import models


# User Model (Customers & Admins)
class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('admin', 'Admin'),
    ]
    
    # Add related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_users',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.'
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_users',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.'
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    otp = models.CharField(max_length=6, null=True, blank=True)  # OTP for Login

    def __str__(self):
        return self.username

