from django.db import models

from api.account.models import OpportunityType
from api.package.models import Package
from api.plan.models import Plan
from api.pricing.models import PricingModel
from api.product.models import Product
from api.tenant.models import Tenant
from api.user.models import User, OrgHierarchy
from api.utils.models import AbstractModel


class PriceBook(AbstractModel):
    """
    Represents a price book in the system.

    Attributes:
        name (str): The name of the price book.
    """

    name = models.CharField(max_length=255)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "pricebook"


class PriceBookEntry(AbstractModel):
    """
    Represents an entry in a price book.

    Attributes:
        price_book_id (PriceBook): Foreign key reference to the associated price book.
        product_id (Product): Foreign key reference to the associated product.
        pricing_model_id (PricingModel): Foreign key reference to the associated pricing model.
        plan_id (Plan): Foreign key reference to the associated plan.
        package_id (Package): Foreign key reference to the associated package.
    """

    price_book_id = models.ForeignKey(
        PriceBook,
        null=True,
        on_delete=models.SET_NULL,
        db_column="price_book_id",
    )
    product_id = models.ForeignKey(
        Product,
        null=True,
        on_delete=models.SET_NULL,
        db_column="product_id",
    )
    pricing_model_id = models.ForeignKey(
        PricingModel,
        null=True,
        on_delete=models.SET_NULL,
        db_column="pricing_model_id",
    )
    plan_id = models.ForeignKey(
        Plan,
        null=True,
        on_delete=models.SET_NULL,
        db_column="plan_id",
    )
    package_id = models.ForeignKey(
        Package,
        null=True,
        on_delete=models.SET_NULL,
        db_column="package_id",
    )
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "pricebook_entry"


class PriceBookRule(AbstractModel):
    """
    Represents a rule in a price book.

    Attributes:
        price_book_id (PriceBook): Foreign key reference to the associated price book.
        user_id (str): The ID of the user associated with the price book rule.
        opportunity_type_id (Package): Foreign key reference to the associated opportunity type.
    """

    price_book_id = models.ForeignKey(
        PriceBook,
        null=True,
        on_delete=models.SET_NULL,
        db_column="price_book_id",
    )
    user_id = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        db_column="user_id",
    )
    org_hierarchy_id = models.ForeignKey(
        OrgHierarchy,
        null=True,
        on_delete=models.SET_NULL,
        db_column="org_hierarchy_id",
    )
    opportunity_type_id = models.ForeignKey(
        OpportunityType,
        null=True,
        on_delete=models.SET_NULL,
        db_column="opportunity_type_id",
    )
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "pricebook_rule"


class PriceBookDiscountPolicy(AbstractModel):
    """
    Represents a discounting policy in a price book.

    Attributes:
        price_book_id (PriceBook): Foreign key reference to the associated price book.
        details (dict): JSON field to store the discounting policy details.
    """

    price_book_id = models.ForeignKey(
        PriceBook,
        null=True,
        on_delete=models.SET_NULL,
        db_column="price_book_id",
    )
    details = models.JSONField()

    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "pricebook_discount_policy"


class PriceBookHistory(AbstractModel):
    """PriceBook Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_pricebook_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    pricebook_id = models.ForeignKey(
        PriceBook, on_delete=models.CASCADE, null=True, db_column="pricebook_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricebook_audit_history"


class PriceBookEntryHistory(AbstractModel):
    """PriceBook Entry Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_pricebook_entry_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    pricebook_entry_id = models.ForeignKey(
        PriceBookEntry, on_delete=models.CASCADE, null=True, db_column="pricebook_entry_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricebook_entry_audit_history"


class PriceBookDiscountPolicyHistory(AbstractModel):
    """PriceBook Discount Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_pricebook_policy_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    pricebook_policy_id = models.ForeignKey(
        PriceBookDiscountPolicy, on_delete=models.CASCADE, null=True, db_column="pricebook_policy_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricebook_discount_policy_audit_history"


class PriceBookRuleHistory(AbstractModel):
    """PriceBook Rule Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_pricebook_rule_history"
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    pricebook_rule_id = models.ForeignKey(
        PriceBookRule, on_delete=models.CASCADE, null=True, db_column="pricebook_rule_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "pricebook_rule_audit_history"
