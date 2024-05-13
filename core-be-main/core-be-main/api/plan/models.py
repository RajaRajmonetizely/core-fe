from django.db import models

from api.feature_repository.models import FeatureRepository
from api.user.models import User
from api.utils.models import AbstractModel


class Plan(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    feature_repository_id = models.ForeignKey(
        FeatureRepository, on_delete=models.CASCADE, db_column="feature_repository_id"
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "plan"


class Tier(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    plan_id = models.ForeignKey(
        Plan, on_delete=models.CASCADE, null=True, db_column="plan_id"
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "tier"


class PlanHistory(AbstractModel):
    """Plan History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="plan_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    plan_id = models.ForeignKey(
        Plan, on_delete=models.CASCADE, null=True, db_column="plan_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "plan_audit_history"
