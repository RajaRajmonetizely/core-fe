from django.db import models

from api.utils.models import AbstractModel


class ContractTemplate(AbstractModel):
    name = models.CharField(default=255)
    s3_doc_file_path = models.CharField(default=255)
    s3_pdf_file_path = models.CharField(default="Pdf not Found")
    description = models.TextField(default=None)
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "contract_template"
