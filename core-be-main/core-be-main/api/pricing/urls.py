from django.urls import path

from .views.pricing_metrics import PricingMetricView
from .views.pricing_model import (
    AddonMetricView,
    DrivingFieldsDetailsView,
    PricingCalculator,
    PricingCurve,
    PricingMetricAddons,
    PricingModelDetailView,
    PricingModelView,
    PricingCurveConfig,
)
from .views.structure import PricingStructureView

urlpatterns = [
    path("/metrics", PricingMetricView.as_view(), name="pricing-metric"),
    path("/structure", PricingStructureView.as_view(), name="pricing-structure"),
    path("/model", PricingModelView.as_view(), name="pricing-model"),
    path("/model/<str:id>", PricingModelDetailView.as_view(), name="pricing-model"),
    path(
        "/model/<str:id>/addon_metric", AddonMetricView.as_view(), name="addon-metric"
    ),
    path(
        "/model/<str:id>/addon",
        PricingMetricAddons.as_view(),
        name="pricing-model-addon",
    ),
    path(
        "/model/calculator/<str:id>",
        PricingCalculator.as_view(),
        name="pricing-calculator-addon",
    ),
    path(
        "/model/<str:id>/addon_metric", AddonMetricView.as_view(), name="addon-metric"
    ),
    path(
        "/model/<str:id>/addon",
        PricingMetricAddons.as_view(),
        name="pricing-model-addon",
    ),
    path(
        "/model/calculator/<str:id>",
        PricingCalculator.as_view(),
        name="pricing-calculator-addon",
    ),
    path("/model/curve/<str:id>", PricingCurve.as_view(), name="pricing-model-curve"),
    path(
        "/model/curve/<str:id>/config",
        PricingCurveConfig.as_view(),
        name="pricing-model-curve-config",
    ),
    path(
        "/model/<str:pricing_model_id>/tier/<str:tier_id>",
        DrivingFieldsDetailsView.as_view(),
        name="core-model-driving-fields",
    ),
    path(
        "/model/curve/<str:id>/config",
        PricingCurveConfig.as_view(),
        name="pricing-model-curve-config",
    ),
    path(
        "/model/<str:pricing_model_id>/tier/<str:tier_id>",
        DrivingFieldsDetailsView.as_view(),
        name="core-model-driving-fields",
    ),
]
