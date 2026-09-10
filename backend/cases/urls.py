from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, CaseLabelViewSet, CaseCommentViewSet

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'labels', CaseLabelViewSet, basename='caselabel')
router.register(r'comments', CaseCommentViewSet, basename='casecomment')

urlpatterns = [
    path('', include(router.urls)),
]
