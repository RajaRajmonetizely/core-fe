from django.db import models

from api.utils.models import AbstractModel


class Tenant(AbstractModel):
    """
    Model to store information about a company (tenant) in the multi-tenant system.
    Each tenant represents a separate company using the CPQ system.

    Fields:
    - name: Name of the company.

    Address Information:
    - address: Physical address of the company.
    - city: City where the company is located.
    - state: State or region where the company is located.
    - postal_code: Postal code of the company's address.
    - country: Country where the company is located.

    Additional Information:
    - notes: Additional notes or description about the company.

    """

    name = models.CharField(max_length=255)

    # Address Information
    address = models.TextField(default="")
    city = models.CharField(max_length=100, default="")
    state = models.CharField(max_length=100, default="")
    postal_code = models.CharField(max_length=20, default="")
    country = models.CharField(max_length=100, default="")
    date_format = models.CharField(max_length=100, default="mm/DD/YYYY")

    # Additional Information
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "tenant"


class TenantConfig(AbstractModel):
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, null=True, db_column="tenant_id"
    )
    config = models.JSONField()

    class Meta:
        db_table = "tenant_config"
