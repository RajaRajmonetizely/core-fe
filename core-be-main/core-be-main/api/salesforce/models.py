from django.db import models

from api.user.models import User
from api.utils.models import AbstractModel


class SalesforceMappingModel(AbstractModel):
    """Salesforce Mapping"""

    name = models.CharField(max_length=100, null=False)
    sf_column_mapping = models.JSONField()
    m_column_mapping = models.JSONField()
    config = models.JSONField(null=True)
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "salesforce_mapping"


class SalesforceMappingHistory(AbstractModel):
    """Salesforce Mapping Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_salesforce_mapping_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    salesforce_mapping_id = models.ForeignKey(
        SalesforceMappingModel, on_delete=models.CASCADE, null=True, db_column="salesforce_mapping_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "salesforce_mapping_audit_history"
