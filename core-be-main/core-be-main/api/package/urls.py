from django.urls import include, path
from rest_framework import routers
from rest_framework.routers import DefaultRouter

from api.package import views


class NoTrailingSlashRouter(DefaultRouter):
    def __init__(self):
        super().__init__()
        self.trailing_slash = ""


router = NoTrailingSlashRouter()
router.register(r"package", views.PackageViewSet, basename="package-crud")

urlpatterns = [path("", include(router.urls))]
