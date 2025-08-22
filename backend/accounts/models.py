from django.contrib.auth.models import AbstractUser
from django.db import models


class LawyerUser(AbstractUser):
    ROLE_CHOICES = [
        ('lawyer', 'Lawyer'),
        ('partner', 'Partner'),
        ('associate', 'Associate'),
        ('paralegal', 'Paralegal'),
        ('admin', 'Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='lawyer')
    bar_number = models.CharField(max_length=50, blank=True, null=True)
    firm_name = models.CharField(max_length=200, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    specializations = models.TextField(blank=True, null=True, help_text="Comma-separated list of legal specializations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lawyer User'
        verbose_name_plural = 'Lawyer Users'
        
    def __str__(self):
        return f"{self.get_full_name()} - {self.role}"
