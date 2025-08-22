from rest_framework import serializers
from .models import Document, DocumentCategory, DocumentVersion, DocumentShare
from accounts.serializers import LawyerUserSerializer
from cases.models import Case


class DocumentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class DocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by_detail = LawyerUserSerializer(source='uploaded_by', read_only=True)
    
    class Meta:
        model = DocumentVersion
        fields = ['id', 'document', 'version_number', 'file', 
                  'changes_description', 'uploaded_by', 'uploaded_by_detail', 
                  'created_at']
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class DocumentShareSerializer(serializers.ModelSerializer):
    shared_with_detail = LawyerUserSerializer(source='shared_with', read_only=True)
    shared_by_detail = LawyerUserSerializer(source='shared_by', read_only=True)
    
    class Meta:
        model = DocumentShare
        fields = ['id', 'document', 'shared_with', 'shared_with_detail',
                  'shared_by', 'shared_by_detail', 'can_edit', 'can_delete',
                  'shared_at', 'expires_at']
        read_only_fields = ['id', 'shared_by', 'shared_at']


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = LawyerUserSerializer(source='uploaded_by', read_only=True)
    category_detail = DocumentCategorySerializer(source='category', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    versions_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'case', 'case_number', 'case_title', 'title', 
                  'description', 'document_type', 'category', 'category_detail',
                  'file', 'file_size', 'file_extension', 'uploaded_by', 
                  'uploaded_by_detail', 'is_confidential', 'tags', 
                  'versions_count', 'shares_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'file_size', 'file_extension', 'uploaded_by', 
                           'created_at', 'updated_at']
    
    def get_versions_count(self, obj):
        return obj.versions.count()
    
    def get_shares_count(self, obj):
        return obj.shares.count()


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['case', 'title', 'description', 'document_type', 
                  'category', 'file', 'is_confidential', 'tags']
        
    def validate_file(self, value):
        # Validate file size (10MB limit set in settings)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must not exceed 10MB")
        return value