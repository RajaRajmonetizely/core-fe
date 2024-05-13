from django.urls import path

from .views import TenantCreateView, TenantUsageMonitor, TenantView
from .views.tenant_config import TenantDealTermsView
from .views.tenant_users import TenantUserView

urlpatterns = [
    path("/monitor", TenantUsageMonitor.as_view({"get": "list"})),
    path("/deal_terms", TenantDealTermsView.as_view(), name="tenant-deal-terms"),
    path(
        "",
        TenantCreateView.as_view({"get": "list", "post": "create"}),
        name="tenant-create",
    ),
    path("/<str:id>", TenantView.as_view(), name="tenant"),
    path("/<str:id>/users", TenantUserView.as_view(), name="tenant-users")
]
