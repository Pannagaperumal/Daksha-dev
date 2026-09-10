from django.db import models
from django.conf import settings
from cases.models import Case
import os


def document_upload_path(instance, filename):
    # Files will be uploaded to MEDIA_ROOT/documents/case_<id>/<filename>
    return f'documents/case_{instance.case.id}/{filename}'


class DocumentCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Document Categories"
        ordering = ['name']
        
    def __str__(self):
        return self.name


class Document(models.Model):
    DOCUMENT_TYPES = [
        ('contract', 'Contract'),
        ('court_filing', 'Court Filing'),
        ('correspondence', 'Correspondence'),
        ('evidence', 'Evidence'),
        ('brief', 'Brief'),
        ('motion', 'Motion'),
        ('discovery', 'Discovery'),
        ('pleading', 'Pleading'),
        ('agreement', 'Agreement'),
        ('report', 'Report'),
        ('other', 'Other'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, default='other')
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    file = models.FileField(upload_to=document_upload_path)
    file_size = models.BigIntegerField(default=0)
    file_extension = models.CharField(max_length=10, blank=True)
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    
    is_confidential = models.BooleanField(default=False)
    tags = models.TextField(blank=True, null=True, help_text="Comma-separated tags")

    is_indexed = models.BooleanField(
        default=False,
        help_text="Whether this document has been ingested into the RAG vector store for chat.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        permissions = [
            ("can_view_confidential", "Can view confidential documents"),
        ]
        
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.file_extension = os.path.splitext(self.file.name)[1].lower()
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.title} - {self.case.case_number}"


class DocumentVersion(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    file = models.FileField(upload_to=document_upload_path)
    changes_description = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['document', 'version_number']
        
    def __str__(self):
        return f"{self.document.title} - Version {self.version_number}"


class DocumentShare(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_documents')
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='documents_shared')
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    shared_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        unique_together = ['document', 'shared_with']
        
    def __str__(self):
        return f"{self.document.title} shared with {self.shared_with}"
