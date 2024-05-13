from django.db import models

from api.package.models import Package
from api.plan.models import Tier
from api.user.models import User
from api.utils.models import AbstractModel


class PricingModel(AbstractModel):
    """Pricing Model"""

    name = models.CharField(max_length=100, null=False)
    package_id = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        null=True,
        db_column="package_id",
        related_name="pricing_model_package_details",
    )
    pricing_structure_id = models.UUIDField(null=True)
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricing_model"


class PricingModelHistory(AbstractModel):
    """Pricing Model History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="pricing_model_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    pricing_model_id = models.ForeignKey(
        PricingModel, on_delete=models.CASCADE, null=True, db_column="pricing_model_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricing_model_audit_history"


class PricingStructure(AbstractModel):
    """Pricing Structure Model"""

    name = models.CharField(max_length=100, null=False)
    custom_formula = models.TextField(null=True)
    details = models.JSONField()
    pricing_model_id = models.ForeignKey(
        PricingModel,
        on_delete=models.CASCADE,
        null=True,
        related_name="pricing_model_custom_structure",
        db_column="pricing_model_id",
    )
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricing_structure"


class PricingMetric(AbstractModel):
    """Pricing Metric Model"""

    name = models.CharField(max_length=100, null=False)
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricing_metric"


class PricingMetricMapping(AbstractModel):
    """Pricing Metric Mapping Model"""

    pricing_metrics_id = models.ForeignKey(
        PricingMetric,
        db_column="pricing_metrics_id",
        on_delete=models.CASCADE,
        null=True,
        related_name="pricing_metric_model_id",
    )
    pricing_model_id = models.ForeignKey(
        PricingModel,
        db_column="pricing_model_id",
        on_delete=models.CASCADE,
        null=True,
        related_name="pricing_metric_model_id",
    )

    class Meta:
        db_table = "pricing_metric_mapping"


class PricingModelDetails(AbstractModel):
    """Pricing Models Details Model"""

    pricing_model_id = models.ForeignKey(
        PricingModel,
        db_column="pricing_model_id",
        on_delete=models.CASCADE,
        null=True,
        related_name="pricing_model_id_details",
    )
    tier_id = models.ForeignKey(
        Tier,
        db_column="tier_id",
        on_delete=models.CASCADE,
        null=True,
        related_name="pricing_model_details_tier",
    )
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricing_model_details"
