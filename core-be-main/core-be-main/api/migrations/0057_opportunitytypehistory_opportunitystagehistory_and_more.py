# Generated by Django 4.2.1 on 2023-08-24 11:53

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0056_userhistory"),
    ]

    operations = [
        migrations.CreateModel(
            name="OpportunityTypeHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("description", models.TextField(null=True)),
                ("details", models.JSONField()),
                (
                    "admin_user_id",
                    models.ForeignKey(
                        db_column="admin_user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        db_column="created_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "opportunity_type_id",
                    models.ForeignKey(
                        db_column="opportunity_type_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.opportunitytype",
                    ),
                ),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.tenant",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        db_column="updated_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "user_id",
                    models.ForeignKey(
                        db_column="user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
            ],
            options={
                "db_table": "opportunity_type_audit_history",
            },
        ),
        migrations.CreateModel(
            name="OpportunityStageHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("description", models.TextField(null=True)),
                ("details", models.JSONField()),
                (
                    "admin_user_id",
                    models.ForeignKey(
                        db_column="admin_user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        db_column="created_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "opportunity_stage_id",
                    models.ForeignKey(
                        db_column="opportunity_stage_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.opportunitystage",
                    ),
                ),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.tenant",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        db_column="updated_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "user_id",
                    models.ForeignKey(
                        db_column="user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
            ],
            options={
                "db_table": "opportunity_stage_audit_history",
            },
        ),
        migrations.CreateModel(
            name="OpportunityHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("description", models.TextField(null=True)),
                ("details", models.JSONField()),
                (
                    "admin_user_id",
                    models.ForeignKey(
                        db_column="admin_user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        db_column="created_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "opportunity_id",
                    models.ForeignKey(
                        db_column="opportunity_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.opportunity",
                    ),
                ),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.tenant",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        db_column="updated_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "user_id",
                    models.ForeignKey(
                        db_column="user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
            ],
            options={
                "db_table": "opportunity_audit_history",
            },
        ),
        migrations.CreateModel(
            name="AccountHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("description", models.TextField(null=True)),
                ("details", models.JSONField()),
                (
                    "account_id",
                    models.ForeignKey(
                        db_column="account_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.account",
                    ),
                ),
                (
                    "admin_user_id",
                    models.ForeignKey(
                        db_column="admin_user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        db_column="created_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.tenant",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        db_column="updated_by",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_%(class)ss",
                        to="api.user",
                    ),
                ),
                (
                    "user_id",
                    models.ForeignKey(
                        db_column="user_id",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.user",
                    ),
                ),
            ],
            options={
                "db_table": "account_audit_history",
            },
        ),
    ]
