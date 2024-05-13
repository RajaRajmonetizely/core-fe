from django.db import models

from api.product.models import Product
from api.user.models import User
from api.utils.models import AbstractModel
from api.tenant.models import Tenant


class FeatureRepository(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    product_id = models.ForeignKey(
        Product,
        db_column="product_id",
        on_delete=models.CASCADE,
        null=True,
        related_name="product_repositories",
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "feature_repository"


class FeatureGroup(AbstractModel):
    name = models.CharField(max_length=255)
    external_name = models.CharField(max_length=255, null=True)
    external_description = models.CharField(max_length=255, null=True)
    feature_repository_id = models.ForeignKey(
        FeatureRepository, on_delete=models.CASCADE, db_column="feature_repository_id"
    )
    sort_order = models.IntegerField(null=True)
    is_independent = models.BooleanField(default=False)
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "feature_group"


class Feature(AbstractModel):
    name = models.CharField(max_length=255)
    external_name = models.CharField(max_length=255, null=True)
    external_description = models.CharField(max_length=255, null=True)
    feature_repository_id = models.ForeignKey(
        FeatureRepository, on_delete=models.CASCADE, db_column="feature_repository_id"
    )
    sort_order = models.IntegerField(null=True)
    feature_group_id = models.ForeignKey(
        FeatureGroup, on_delete=models.CASCADE, null=True, db_column="feature_group_id"
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "feature"


class FeatureRepositoryHistory(AbstractModel):
    """Feature Repository History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="feature_repository_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    feature_repository_id = models.ForeignKey(
        FeatureRepository, on_delete=models.CASCADE, null=True, db_column="feature_repository_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "feature_repository_audit_history"


class FeatureGroupHistory(AbstractModel):
    """Feature Group History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="feature_group_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    feature_group_id = models.ForeignKey(
        FeatureGroup, on_delete=models.CASCADE, null=True, db_column="feature_group_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "feature_group_audit_history"


class FeatureHistory(AbstractModel):
    """Feature History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="feature_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    feature_id = models.ForeignKey(
        Feature, on_delete=models.CASCADE, null=True, db_column="feature_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "feature_audit_history"
