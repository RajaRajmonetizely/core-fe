from django.db import models
from django.db.models import JSONField

from api.plan.models import Plan, Tier
from api.user.models import User
from api.utils.models import AbstractModel


class Package(AbstractModel):
    """Package Model"""

    name = models.CharField(max_length=100, null=False)
    plan_id = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        null=True,
        db_column="plan_id",
        related_name="tiers_details",
    )
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "package"

    def __str__(self):
        return self.name


class PackageDetail(AbstractModel):
    """Package Details Model"""

    package_id = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        related_name="package_details",
        db_column="package_id",
    )
    tier_id = models.ForeignKey(
        Tier,
        on_delete=models.CASCADE,
        db_column="tier_id",
        related_name="tiers_details",
    )
    details = JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "package_detail"


class PackageHistory(AbstractModel):
    """Package History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="package_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    package_id = models.ForeignKey(
        Package, on_delete=models.CASCADE, null=True, db_column="package_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "package_audit_history"
