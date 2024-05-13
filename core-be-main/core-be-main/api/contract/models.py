from django.db import models

from api.account.models import Contract
from api.utils.models import AbstractModel, ESignStatus


class ContractSignature(AbstractModel):
    title = models.CharField(max_length=100, null=False)
    subject = models.CharField(max_length=100, null=False)
    message = models.TextField(null=False)
    details_url = models.TextField()
    files_url = models.TextField()
    final_copy_uri = models.TextField()
    signing_url = models.TextField()
    signature_request_id = models.TextField()
    maintain_order_at = models.CharField(max_length=100, null=True)
    expires_at = models.DateTimeField(null=True)
    has_error = models.BooleanField(default=False)
    status = models.CharField(choices=ESignStatus.choices, default=ESignStatus.Draft.value)
    contract_id = models.ForeignKey(
        Contract, on_delete=models.CASCADE, db_column="contract_id"
    )

    class Meta:
        db_table = "contract_signature"


class EventDetail(AbstractModel):
    event_type = models.CharField()
    event_time = models.DateTimeField()
    event_hash = models.CharField()
    event_metadata = models.JSONField()
    contract_signature_id = models.ForeignKey(
        ContractSignature, on_delete=models.CASCADE, null=True,
        db_column="contract_signature_id"
    )

    class Meta:
        db_table = "event_detail"


class ContractSignerDetails(AbstractModel):
    signer_name = models.CharField(max_length=100, null=False)
    signer_email_address = models.CharField(max_length=100, null=False)
    signer_type = models.CharField(max_length=100, null=True)
    order = models.IntegerField(null=True)
    signature_id = models.CharField()
    contract_signature_id = models.ForeignKey(
        "ContractSignature", on_delete=models.SET_NULL,
        db_column="contract_signature_id", null=True
    )

    class Meta:
        db_table = "contract_signer_details"


class ContractSignerAudit(AbstractModel):
    last_viewed_at = models.DateTimeField(null=True)
    last_reminded_at = models.DateTimeField(null=True)
    signed_at = models.DateTimeField(null=True)
    status_code = models.TextField(null=True)
    error = models.TextField(null=True)
    contract_signer_details_id = models.ForeignKey(
        ContractSignerDetails, on_delete=models.CASCADE, null=True,
        db_column="contract_signer_details_id"
    )
    event_detail_id = models.ForeignKey(
        EventDetail, on_delete=models.CASCADE, null=True,
        db_column="event_detail_id"
    )

    class Meta:
        db_table = "contract_signer_audit_history"
