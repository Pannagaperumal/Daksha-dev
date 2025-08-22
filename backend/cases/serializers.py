from rest_framework import serializers
from .models import Case, CaseLabel, CaseComment
from accounts.serializers import LawyerUserSerializer


class CaseLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseLabel
        fields = ['id', 'name', 'color', 'description', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class CaseCommentSerializer(serializers.ModelSerializer):
    author_detail = LawyerUserSerializer(source='author', read_only=True)
    
    class Meta:
        model = CaseComment
        fields = ['id', 'case', 'author', 'author_detail', 'content', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class CaseSerializer(serializers.ModelSerializer):
    assigned_to_detail = LawyerUserSerializer(source='assigned_to', read_only=True)
    created_by_detail = LawyerUserSerializer(source='created_by', read_only=True)
    labels_detail = CaseLabelSerializer(source='labels', many=True, read_only=True)
    documents_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = ['id', 'case_number', 'title', 'description', 'client_name', 
                  'client_email', 'client_phone', 'client_address', 'status', 
                  'priority', 'labels', 'labels_detail', 'assigned_to', 
                  'assigned_to_detail', 'created_by', 'created_by_detail', 
                  'court_name', 'judge_name', 'opposing_counsel', 'filing_date', 
                  'hearing_date', 'deadline', 'notes', 'documents_count', 
                  'comments_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
        
    def get_documents_count(self, obj):
        return obj.documents.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()


class CaseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ['case_number', 'title', 'description', 'client_name', 
                  'client_email', 'client_phone', 'client_address', 'status', 
                  'priority', 'labels', 'assigned_to', 'court_name', 
                  'judge_name', 'opposing_counsel', 'filing_date', 
                  'hearing_date', 'deadline', 'notes']