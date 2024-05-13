from django.db import models

from api.document.models import ContractTemplate
from api.product.models import Product
from api.tenant.models import Tenant
from api.user.models import User
from api.utils.models import AbstractModel


class IndustryType(AbstractModel):
    """Industry Type Model"""

    name = models.CharField(max_length=255)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "industry_type"


class Account(AbstractModel):
    """Account Model

    Attributes:
        name (str): The name of the account.
        account_number (str): The account ID.
        description (str, optional): The description of the account. Defaults to None.
        owner_id (User): The ID of the owner associated with the account.
        is_active (bool): Indicates if the account is active.
        annual_revenue (float): The annual revenue of the account.
        no_of_employees (int): The number of employees in the account.
        funding_amount (str, optional): The funding amount of the account. Defaults to None.
        billing_street (str, optional): The billing street address. Defaults to None.
        billing_city (str, optional): The billing city. Defaults to None.
        billing_state (str, optional): The billing state. Defaults to None.
        billing_postal_code (str, optional): The billing postal code. Defaults to None.
        billing_country (str, optional): The billing country. Defaults to None.
        shipping_street (str, optional): The shipping street address. Defaults to None.
        shipping_city (str, optional): The shipping city. Defaults to None.
        shipping_state (str, optional): The shipping state. Defaults to None.
        shipping_postal_code (str, optional): The shipping postal code. Defaults to None.
        shipping_country (str, optional): The shipping country. Defaults to None.
        industry_type_id (IndustryType, optional): The industry type of the account. Defaults to None.
        ownership (str, optional): The ownership details of the account. Defaults to None.
        upsell_opportunity (str, optional): Details about upsell opportunities. Defaults to None.
        year_started (str, optional): The year the account started. Defaults to None.
        site (str, optional): The site of the account. Defaults to None.
        website (str, optional): The website URL of the account. Defaults to None.
        account_ext_id (str, optional): The external key of the account in Salesforce. Defaults to None.
        tenant_id (Tenant, optional): The ID of the Tenant. Defaults to None.
        created_by (User, optional): The user who created the account. Defaults to None.
        updated_by (User, optional): The user who updated the account. Defaults to None.
    """

    # General information
    name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=255, null=True)  # account_id
    description = models.TextField(null=True)
    owner_id = models.ForeignKey(
        User,
        null=True,
        on_delete=models.CASCADE,
        related_name="account_owner",
        db_column="owner_id",
    )
    is_active = models.BooleanField(default=True)

    # Financial information
    annual_revenue = models.BigIntegerField(null=True)
    no_of_employees = models.BigIntegerField(null=True)
    funding_amount = models.BigIntegerField(null=True)

    # Address information
    billing_street = models.TextField(null=True)
    billing_city = models.CharField(max_length=255, null=True)
    billing_state = models.CharField(max_length=255, null=True)
    billing_postal_code = models.CharField(max_length=255, null=True)
    billing_country = models.CharField(max_length=255, null=True)
    shipping_street = models.TextField(null=True)
    shipping_city = models.CharField(max_length=255, null=True)
    shipping_state = models.CharField(max_length=255, null=True)
    shipping_postal_code = models.CharField(max_length=255, null=True)
    shipping_country = models.CharField(max_length=255, null=True)

    # Additional details
    ownership = models.CharField(max_length=255, null=True)
    upsell_opportunity = models.CharField(max_length=255, null=True)
    year_started = models.CharField(max_length=50, null=True)
    site = models.CharField(max_length=255, null=True)
    website = models.TextField(null=True)
    account_ext_id = models.CharField(max_length=255, null=True)
    industry_type_id = models.ForeignKey(
        IndustryType,
        on_delete=models.SET_NULL,
        db_column="industry_type_id",
        null=True,
        related_name="account_industry_type",
    )
    custom_field_1 = models.CharField(max_length=255, null=True)
    custom_field_2 = models.CharField(max_length=255, null=True)
    custom_field_3 = models.TextField(max_length=255, null=True)
    custom_field_4 = models.CharField(max_length=255, null=True)
    type = models.CharField(max_length=255, null=True)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    created_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="account_created_by",
        db_column="created_by",
    )
    updated_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="account_updated_by",
        db_column="updated_by",
    )

    # Quote related details
    contact_name = models.CharField(max_length=200, default="")
    email = models.CharField(max_length=200, default="")

    quote_to_name = models.CharField(max_length=200, null=True)
    quote_to_address = models.CharField(max_length=200, null=True)

    bill_to_name = models.CharField(max_length=200, null=True)
    ship_to_name = models.CharField(max_length=200, null=True)

    class Meta:
        db_table = "account"


class Contract(AbstractModel):
    """Contract Model"""

    # Identification
    account_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="contract_account_id",
        db_column="account_id",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(null=True)
    contract_number = models.CharField(max_length=255)
    contract_external_number = models.CharField(max_length=255, null=True)
    company_signed_email = models.EmailField(max_length=255, null=True)
    company_signed_date = models.DateTimeField(null=True)
    activated_date = models.DateTimeField(null=True)
    start_date = models.DateTimeField(null=True)
    end_date = models.DateTimeField(null=True)

    customer_signed_email = models.EmailField(max_length=255, null=True)
    customer_signed_date = models.DateTimeField(null=True)
    customer_signed_title = models.CharField(max_length=255, null=True)

    # Address information
    billing_street = models.TextField(null=True)
    billing_city = models.CharField(max_length=255, null=True)
    billing_state = models.CharField(max_length=255, null=True)
    billing_postal_code = models.CharField(max_length=255, null=True)
    billing_country = models.CharField(max_length=255, null=True)
    shipping_street = models.TextField(null=True)
    shipping_city = models.CharField(max_length=255, null=True)
    shipping_state = models.CharField(max_length=255, null=True)
    shipping_postal_code = models.CharField(max_length=255, null=True)
    shipping_country = models.CharField(max_length=255, null=True)

    special_terms = models.TextField(null=True)

    # Timing and Dates
    close_date = models.DateTimeField(null=True)
    created_date = models.DateField(null=True)

    contract_external_id = models.CharField(max_length=255, null=True)
    contract_url = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=100, null=True)

    # Relationships and References
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    custom_field_1 = models.CharField(max_length=255, null=True)
    custom_field_2 = models.CharField(max_length=255, null=True)
    custom_field_3 = models.TextField(max_length=255, null=True)
    custom_field_4 = models.CharField(max_length=255, null=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="contract_created_by",
        db_column="created_by",
    )
    updated_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="contract_updated_by",
        db_column="updated_by",
    )
    signer_count = models.JSONField(default=dict)
    s3_file_path = models.TextField(null=True)
    signed_file_path = models.TextField(null=True)
    template_id = models.ForeignKey(
        ContractTemplate,
        null=True,
        on_delete=models.SET_NULL,
        related_name="contract_template",
        db_column="template_id",
    )

    class Meta:
        db_table = "contract"


class OpportunityType(AbstractModel):
    """Opportunity Type Model

    Attributes:
        name (str): The name of the opportunity type.
        tenant_id (Tenant, optional): The id of the Tenant. Defaults to None.
    """

    name = models.CharField(max_length=255)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "opportunity_type"


class OpportunityStage(AbstractModel):
    """Opportunity Stage Model

    Attributes:
        name (str): The name of the opportunity stage.
        tenant_id (Tenant, optional): The id of the Tenant. Defaults to None.
    """

    name = models.CharField(max_length=255)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "opportunity_stage"


class Opportunity(AbstractModel):
    """Opportunity Model

    Attributes:
        account_id (str): The ID of the associated account.
        name (str): The name of the opportunity.
        amount (str): The amount of the opportunity (integer representation).
        probability (float): The probability of the opportunity's success.
        close_date (datetime): The expected closing date of the opportunity.
        description (str): A detailed description of the opportunity.
        type_id (OpportunityType): The type of the opportunity.
        owner_id (str): The ID of the owner associated with the opportunity.
        stage_id (OpportunityStage): The stage of the opportunity.
        op_external_id (str): The external ID or reference for the opportunity in salesforce.
        contract_id (str): The ID of the contract related to the opportunity.
        contract_link (str): The link to the contract document.
        tenant_id (Tenant, optional): The id of the Tenant. Defaults to None.
    """

    # Identification
    account_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="account_id",
        db_column="account_id",
    )
    name = models.CharField(max_length=255)

    # Financial details
    amount = models.BigIntegerField(null=True)  # integer
    probability = models.CharField(max_length=50, null=True)

    # Timing and Dates
    close_date = models.DateTimeField(null=True)
    created_date = models.DateField(null=True)

    # Descriptive Information
    description = models.TextField(null=True)

    # Relationships and References
    type_id = models.ForeignKey(
        OpportunityType, on_delete=models.SET_NULL, db_column="type_id", null=True
    )
    owner_id = models.ForeignKey(
        User, on_delete=models.SET_NULL, db_column="owner_id", null=True
    )
    stage_id = models.ForeignKey(
        OpportunityStage, on_delete=models.SET_NULL, db_column="stage_id", null=True
    )
    op_external_id = models.CharField(max_length=255, null=True)

    # Contract Information
    contract_ext_id = models.CharField(max_length=255, null=True)
    contract_id = models.ForeignKey(
        Contract, on_delete=models.SET_NULL, db_column="contract_id", null=True
    )
    contract_link = models.TextField(max_length=255, null=True)
    custom_field_1 = models.CharField(max_length=255, null=True)
    custom_field_2 = models.CharField(max_length=255, null=True)
    custom_field_3 = models.TextField(max_length=255, null=True)
    custom_field_4 = models.CharField(max_length=255, null=True)
    tenant_id = models.ForeignKey(
        Tenant, on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    created_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="opportunity_created_by",
        db_column="created_by",
    )
    updated_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="opportunity_updated_by",
        db_column="updated_by",
    )

    class Meta:
        db_table = "opportunity"


class AccountHistory(AbstractModel):
    """Account Audit History Model"""

    admin_user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="admin_user_id",
        related_name="admin_user_id_account_history",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    account_id = models.ForeignKey(
        Account, on_delete=models.CASCADE, null=True, db_column="account_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "account_audit_history"


class OpportunityHistory(AbstractModel):
    """Opportunity Audit History Model"""

    admin_user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="admin_user_id",
        related_name="admin_user_id_opportunity_history",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    opportunity_id = models.ForeignKey(
        Opportunity, on_delete=models.CASCADE, null=True, db_column="opportunity_id"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "opportunity_audit_history"


class OpportunityStageHistory(AbstractModel):
    """Opportunity Stage Audit History Model"""

    admin_user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="admin_user_id",
        related_name="admin_user_id_opportunity_stage_history",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    opportunity_stage_id = models.ForeignKey(
        OpportunityStage,
        on_delete=models.CASCADE,
        null=True,
        db_column="opportunity_stage_id",
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "opportunity_stage_audit_history"


class OpportunityTypeHistory(AbstractModel):
    """Opportunity Type Audit History Model"""

    admin_user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        db_column="admin_user_id",
        related_name="admin_user_id_opportunity_type_history",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    opportunity_type_id = models.ForeignKey(
        OpportunityType,
        on_delete=models.CASCADE,
        null=True,
        db_column="opportunity_type_id",
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )

    class Meta:
        db_table = "opportunity_type_audit_history"
