from django.urls import include, path
from rest_framework import routers
from rest_framework.routers import DefaultRouter

from api.product import views


class NoTrailingSlashRouter(DefaultRouter):
    def __init__(self):
        super().__init__()
        self.trailing_slash = ""


router = NoTrailingSlashRouter()
router.register(r"product", views.ProductViewSet, basename="product-crud")

urlpatterns = [
    path("", include(router.urls)),
]
