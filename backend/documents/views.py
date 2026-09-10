import logging

import requests
from django.conf import settings
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Document, DocumentCategory, DocumentVersion, DocumentShare
from .serializers import (
    DocumentSerializer, DocumentUploadSerializer,
    DocumentCategorySerializer, DocumentVersionSerializer, DocumentShareSerializer
)

logger = logging.getLogger(__name__)


def ingest_document(document: Document) -> None:
    """
    Send an uploaded PDF to the rag-backend app-server so it gets embedded
    into the local vector store and becomes chattable. Best-effort: a
    failure here does not fail the upload, it just leaves is_indexed=False.
    """
    if document.file_extension.lower() != '.pdf':
        return
    try:
        with document.file.open('rb') as f:
            response = requests.post(
                f'{settings.RAG_APP_SERVER_URL}/ingest',
                files={'file': (document.file.name, f, 'application/pdf')},
                data={
                    'case': str(document.case_id),
                    'document': str(document.id),
                    'title': document.title,
                },
                timeout=60,
            )
        response.raise_for_status()
        document.is_indexed = True
        document.save(update_fields=['is_indexed'])
    except Exception:
        logger.exception('Failed to ingest document %s into rag-backend', document.id)


class DocumentCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document categories.
    """
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case documents.
    """
    queryset = Document.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['case', 'document_type', 'category', 'is_confidential']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(uploaded_by=request.user)
        ingest_document(document)
        document.refresh_from_db()
        return Response(DocumentSerializer(document, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reindex(self, request, pk=None):
        """Retry ingesting a document into the RAG vector store."""
        document = self.get_object()
        ingest_document(document)
        document.refresh_from_db()
        return Response(DocumentSerializer(document, context=self.get_serializer_context()).data)


class DocumentVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document versions.
    """
    queryset = DocumentVersion.objects.all()
    serializer_class = DocumentVersionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['document']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class DocumentShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document shares.
    """
    queryset = DocumentShare.objects.all()
    serializer_class = DocumentShareSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['document', 'shared_with']

    def perform_create(self, serializer):
        serializer.save(shared_by=self.request.user)
