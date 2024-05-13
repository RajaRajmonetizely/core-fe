from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.document.views import ContractTemplateViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"document", ContractTemplateViewSet, basename="document-crud")
urlpatterns = [
    path("", include(router.urls))
]
