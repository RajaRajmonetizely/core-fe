from django.urls import include, path
from rest_framework import routers

from api.pricebook.views.pricebook import PriceBookViewSet
from api.pricebook.views.pricebook_discount_policy import PriceBookDiscountPolicyViewSet, \
    PriceBookUserDiscountView
from api.pricebook.views.pricebook_rule import PriceBookRuleViewSet

router = routers.DefaultRouter(trailing_slash=False)

router.register(r"pricebook/rule", PriceBookRuleViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("pricebook", PriceBookViewSet.as_view({"post": "create", "get": "list"})),
    path("pricebook/<uuid:pk>", PriceBookViewSet.as_view({"put": "update", "delete": "destroy"})),
    path("pricebook/<uuid:pk>/details", PriceBookViewSet.as_view({"get": "retrieve"})),
    path(
        "pricebook/<uuid:pk>/discount_policy",
        PriceBookDiscountPolicyViewSet.as_view(
            {"put": "update", "delete": "destroy", "get": "list"}
        ),
    ),
    path("pricebook/<str:id>/discount", PriceBookUserDiscountView.as_view(),
         name="price-book-discount")
]
