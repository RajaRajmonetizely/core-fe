from django.db import models

from api.user.models import User
from api.utils.models import AbstractModel


class Product(AbstractModel):
    """Product Model"""

    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=200, null=True)
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "product"

    def __str__(self):
        return self.name


class ProductAuditHistory(AbstractModel):
    """Product Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_product_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    product_id = models.ForeignKey(
        Product, on_delete=models.CASCADE, null=True, db_column="product_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "product_audit_history"

    def __str__(self):
        return self.description
