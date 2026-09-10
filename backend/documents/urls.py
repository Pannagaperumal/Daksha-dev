from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, DocumentCategoryViewSet, DocumentVersionViewSet, DocumentShareViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'categories', DocumentCategoryViewSet, basename='documentcategory')
router.register(r'versions', DocumentVersionViewSet, basename='documentversion')
router.register(r'shares', DocumentShareViewSet, basename='documentshare')

urlpatterns = [
    path('', include(router.urls)),
]
