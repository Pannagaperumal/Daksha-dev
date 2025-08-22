from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Case, CaseLabel, CaseComment
from .serializers import (
    CaseSerializer, CaseCreateUpdateSerializer,
    CaseLabelSerializer, CaseCommentSerializer
)


class CaseLabelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case labels/tags.
    
    list: Get all case labels
    create: Create a new case label
    retrieve: Get a specific case label
    update: Update a case label
    partial_update: Partially update a case label
    destroy: Delete a case label
    """
    queryset = CaseLabel.objects.all()
    serializer_class = CaseLabelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing legal cases.
    
    list: Get all cases with filtering and search
    create: Create a new case
    retrieve: Get a specific case details
    update: Update a case
    partial_update: Partially update a case
    destroy: Delete a case
    """
    queryset = Case.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'labels']
    search_fields = ['case_number', 'title', 'description', 'client_name', 'client_email']
    ordering_fields = ['created_at', 'updated_at', 'hearing_date', 'deadline', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CaseCreateUpdateSerializer
        return CaseSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @swagger_auto_schema(
        operation_description="Get cases assigned to current user",
        responses={200: CaseSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_cases(self, request):
        """Get cases assigned to the current user"""
        cases = self.get_queryset().filter(assigned_to=request.user)
        serializer = CaseSerializer(cases, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Get case statistics",
        responses={
            200: openapi.Response(
                description="Case statistics",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'open_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'closed_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'urgent_cases': openapi.Schema(type=openapi.TYPE_INTEGER),
                    }
                )
            )
        }
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get case statistics"""
        queryset = self.get_queryset()
        stats = {
            'total_cases': queryset.count(),
            'open_cases': queryset.filter(status='open').count(),
            'closed_cases': queryset.filter(status='closed').count(),
            'urgent_cases': queryset.filter(priority='urgent').count(),
            'in_progress_cases': queryset.filter(status='in_progress').count(),
        }
        return Response(stats)
    
    @swagger_auto_schema(
        operation_description="Add a comment to a case",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['content'],
            properties={
                'content': openapi.Schema(type=openapi.TYPE_STRING, description='Comment content'),
            }
        ),
        responses={201: CaseCommentSerializer}
    )
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a case"""
        case = self.get_object()
        serializer = CaseCommentSerializer(data={
            'case': case.id,
            'content': request.data.get('content')
        })
        if serializer.is_valid():
            serializer.save(author=request.user, case=case)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Get all comments for a case",
        responses={200: CaseCommentSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for a case"""
        case = self.get_object()
        comments = case.comments.all()
        serializer = CaseCommentSerializer(comments, many=True)
        return Response(serializer.data)


class CaseCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case comments.
    
    list: Get all comments
    create: Create a new comment
    retrieve: Get a specific comment
    update: Update a comment
    partial_update: Partially update a comment
    destroy: Delete a comment
    """
    queryset = CaseComment.objects.all()
    serializer_class = CaseCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['case', 'author']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
