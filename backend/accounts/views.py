from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import LawyerUser
from .serializers import LawyerUserSerializer, UserRegistrationSerializer, ChangePasswordSerializer

User = get_user_model()


class LawyerUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing lawyer users.
    
    list: Get all lawyer users
    create: Create a new lawyer user
    retrieve: Get a specific lawyer user
    update: Update a lawyer user
    partial_update: Partially update a lawyer user
    destroy: Delete a lawyer user
    """
    queryset = LawyerUser.objects.all()
    serializer_class = LawyerUserSerializer
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get current user profile",
        responses={200: LawyerUserSerializer}
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current authenticated user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Update current user profile",
        request_body=LawyerUserSerializer,
        responses={200: LawyerUserSerializer}
    )
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Update current authenticated user's profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Change user password",
        request_body=ChangePasswordSerializer,
        responses={
            200: openapi.Response('Password changed successfully'),
            400: 'Bad Request'
        }
    )
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change password for authenticated user"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"detail": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new lawyer user
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_description="Register a new lawyer user account",
        request_body=UserRegistrationSerializer,
        responses={
            201: LawyerUserSerializer,
            400: 'Validation Error'
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
