from django.urls import path

from .views import PlanCreateView, PlanView, TierCreateView, TierView

urlpatterns = [
    path("", PlanCreateView.as_view(), name="plan-create"),
    path("/<str:id>", PlanView.as_view(), name="plan"),
    path("/tier/", TierCreateView.as_view(), name="plan-tiers"),
    path("/<str:id>/tiers", TierView.as_view(), name="tier-view"),
]
