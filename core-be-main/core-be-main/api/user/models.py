from django.db import models

from api.utils.models import AbstractModel


class UserRole(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=100, null=False, default=None)
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    id_ext_key = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "user_role"


class OrgHierarchy(AbstractModel):
    parent_id = models.ForeignKey(
        "OrgHierarchy",
        on_delete=models.SET_NULL,
        db_column="parent_id",
        default=None,
        null=True,
    )
    name = models.CharField(max_length=100, null=False)
    description = models.CharField(max_length=100, null=True, default=None)
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    id_ext_key = models.CharField(max_length=100, null=True)
    parent_role_ext_key = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "org_hierarchy"


class User(AbstractModel):
    is_active = models.BooleanField(default=True)
    alias = models.CharField(max_length=255, null=True)
    name = models.CharField(max_length=255)
    photo_url = models.CharField(max_length=255, null=True)
    email = models.CharField(max_length=255)
    username = models.CharField(max_length=255, null=True)
    nickname = models.CharField(max_length=255, null=True)
    federation_id = models.CharField(max_length=255, null=True)
    user_licence_id = models.CharField(max_length=255, null=True)
    manager_id = models.ForeignKey(
        "User", on_delete=models.SET_NULL, null=True, db_column="manager_id"
    )
    tenant_id = models.ForeignKey(
        "Tenant", on_delete=models.SET_NULL, db_column="tenant_id", null=True
    )
    org_hierarchy_id = models.ForeignKey(
        "OrgHierarchy",
        on_delete=models.SET_NULL,
        db_column="org_hierarchy_id",
        default=None,
        null=True,
    )
    id_ext_key = models.CharField(max_length=100, null=True)
    org_hierarchy_id_ext_key = models.CharField(max_length=100, null=True)
    manager_id_ext_key = models.CharField(max_length=100, null=True)
    custom_field_1 = models.CharField(max_length=255, null=True)
    custom_field_2 = models.CharField(max_length=255, null=True)
    custom_field_3 = models.TextField(max_length=255, null=True)
    custom_field_4 = models.CharField(max_length=255, null=True)
    created_by = models.ForeignKey(
        "User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="user_created_by",
        db_column="created_by",
    )
    updated_by = models.ForeignKey(
        "User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="user_updated_by",
        db_column="updated_by",
    )
    is_monetizely_user = models.BooleanField(default=False)
    cognito_user_id = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "user"


class UserRoleMapping(AbstractModel):
    user_role_id = models.ForeignKey(
        "UserRole", on_delete=models.SET_NULL, db_column="user_role_id", null=True
    )
    user_id = models.ForeignKey(
        "User", on_delete=models.SET_NULL, db_column="user_id", null=True
    )
    is_salesforce = models.BooleanField(default=False)

    class Meta:
        db_table = "user_role_map"


class UserSettings(AbstractModel):
    user_id = models.ForeignKey("User", on_delete=models.SET_NULL, db_column="user_id", null=True)
    name = models.CharField(max_length=100, null=True)
    value = models.BooleanField(default=False)

    class Meta:
        db_table = "user_settings"


class UserHistory(AbstractModel):
    """User Audit History Model"""

    admin_user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="admin_user_id",
        related_name="admin_user_id_history",
    )
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_id"
    )
    user_model_id = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, db_column="user_model_id", related_name="user_model_id_history"
    )
    description = models.TextField(null=True)
    details = models.JSONField()
    tenant_id = models.ForeignKey('Tenant', on_delete=models.SET_NULL, db_column="tenant_id",
                                  null=True)

    class Meta:
        db_table = "user_audit_history"
