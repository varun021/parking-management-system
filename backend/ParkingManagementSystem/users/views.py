# users/views.py
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from .serializers import UserSerializer, RegisterSerializer, OTPSerializer, OTPVerificationSerializer

User = get_user_model()

# Generate OTP
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Send OTP via email
def send_otp_email(email, otp):
    subject = 'Your OTP for Parking Management System'
    message = f'Your OTP for login is: {otp}. This OTP will expire in 10 minutes.'
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    send_mail(subject, message, email_from, recipient_list)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate OTP and save it to user
        otp = generate_otp()
        user.otp = otp
        user.save()
        
        # Send OTP via email
        send_otp_email(user.email, otp)
        
        return Response({
            "message": "User registered successfully. Please verify your OTP.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)

class RequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate new OTP and save it
        otp = generate_otp()
        user.otp = otp
        user.save()
        
        # Send OTP via email
        send_otp_email(email, otp)
        
        return Response({"message": "OTP sent successfully."}, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        try:
            user = User.objects.get(email=email, otp=otp)
            
            # Clear the OTP
            user.otp = None
            user.save()
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
