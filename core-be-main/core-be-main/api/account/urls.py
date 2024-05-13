from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.account.views.account import AccountViewSet, IndustryTypeViewSet
from api.account.views.opportunity import OpportunityViewSet
from api.account.views.opportunity_stage_type import (
    OpportunityStageViewSet,
    OpportunityTypeViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"account", AccountViewSet, basename="account-crud")
router.register(r"industry_type", IndustryTypeViewSet, basename="industry-type-crud")
router.register(
    r"opportunity/stage", OpportunityStageViewSet, basename="opportunity-stage-crud"
)
router.register(
    r"opportunity/type", OpportunityTypeViewSet, basename="opportunity-type-crud"
)
router.register(r"opportunity", OpportunityViewSet, basename="opportunity-crud")

urlpatterns = [
    path("", include(router.urls)),
]
