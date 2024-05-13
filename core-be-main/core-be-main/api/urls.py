from django.urls import include, path

urlpatterns = [
    path("repository", include("api.feature_repository.urls")),
    path("plan", include("api.plan.urls")),
    path("", include("api.package.urls")),
    path("", include("api.product.urls")),
    path("pricing", include("api.pricing.urls")),
    path("user", include("api.user.urls")),
    path("tenant", include("api.tenant.urls")),
    path("", include("api.account.urls")),
    path("", include("api.pricebook.urls")),
    path("", include("api.salesforce.urls")),
    path("", include("api.deal_desk.urls")),
    path("quote", include("api.pricing_calculator.urls")),
    path("rbac", include("api.rbac.urls")),
    path("", include("api.document.urls")),
    path("contract", include("api.contract.urls")),
]
