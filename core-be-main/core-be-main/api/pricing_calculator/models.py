from django.db import models

from api.account.models import Contract, Opportunity
from api.plan.models import Tier
from api.pricebook.models import PriceBook
from api.product.models import Product
from api.user.models import User
from api.utils.models import AbstractModel


class Quote(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    opportunity_id = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, null=True, db_column="opportunity_id"
    )
    price_book_id = models.ForeignKey(
        PriceBook, on_delete=models.CASCADE, null=True, db_column="price_book_id"
    )
    user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="user_id",
        related_name="quote_user_id",
    )
    assigned_to = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="assigned_to"
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    contract_id = models.ForeignKey(
        Contract, on_delete=models.SET_NULL, db_column="contract_id", null=True
    )
    total_price = models.IntegerField(default=0)
    discount = models.DecimalField(decimal_places=2, max_digits=5, default=0)
    quote_number = models.CharField(max_length=100, null=True)
    quote_url = models.TextField(null=True)
    account_id = models.ForeignKey(
        "Account", on_delete=models.SET_NULL, db_column="account_id", null=True
    )
    quote_external_id = models.CharField(max_length=100, null=True)
    status = models.CharField(max_length=100, default="draft")
    custom_field_1 = models.CharField(max_length=255, null=True)
    custom_field_2 = models.CharField(max_length=255, null=True)
    custom_field_3 = models.TextField(max_length=255, null=True)
    custom_field_4 = models.CharField(max_length=255, null=True)

    expiration_date = models.DateField(null=True)
    deal_term_details = models.JSONField(null=True)
    config_details = models.JSONField(null=True)

    class Meta:
        db_table = "quote"


class QuoteDetails(AbstractModel):
    quote_id = models.ForeignKey(
        Quote, on_delete=models.CASCADE, null=False, db_column="quote_id"
    )
    details = models.JSONField(null=False)
    product_id = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=False,
        db_column="product_id",
    )
    tier_id = models.ForeignKey(
        Tier,
        on_delete=models.CASCADE,
        null=False,
        db_column="tier_id",
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "quote_details"


class QuoteNote(AbstractModel):
    quote_id = models.ForeignKey(
        Quote, on_delete=models.CASCADE, null=False, db_column="quote_id"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, db_column="user_id"
    )
    comment = models.CharField(max_length=100, null=False)

    class Meta:
        db_table = "quote_note"


class QuoteHistory(AbstractModel):
    """Quote Model History Model"""

    admin_user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="admin_user_id",
        related_name="quote_admin_user_id",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    quote_id = models.ForeignKey(
        Quote, on_delete=models.CASCADE, null=True, db_column="quote_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "quote_audit_history"
