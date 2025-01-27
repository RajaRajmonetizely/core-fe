# Generated by Django 4.2.1 on 2023-06-14 09:11

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0004_user_management"),
    ]

    operations = [
        migrations.CreateModel(
            name="Address",
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
                ("country", models.TextField()),
                ("city", models.TextField()),
                ("street", models.TextField()),
                ("state", models.TextField()),
                ("zipcode", models.TextField()),
            ],
            options={
                "db_table": "address",
            },
        ),
        migrations.CreateModel(
            name="OpportunityStage",
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
                ("name", models.CharField(max_length=255)),
            ],
            options={
                "db_table": "opportunity_stage",
            },
        ),
        migrations.CreateModel(
            name="OpportunityType",
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
                ("name", models.CharField(max_length=255)),
            ],
            options={
                "db_table": "opportunity_type",
            },
        ),
        # migrations.AddField(
        #     model_name="orghierarchy",
        #     name="tenant_id",
        #     field=models.ForeignKey(
        #         db_column="tenant_id",
        #         null=True,
        #         on_delete=django.db.models.deletion.SET_NULL,
        #         to="api.tenant",
        #     ),
        # ),
        migrations.AlterField(
            model_name="user",
            name="org_hierarchy_id",
            field=models.ForeignKey(
                db_column="org_hierarchy_id",
                default=None,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.orghierarchy",
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="user_role_id",
            field=models.ForeignKey(
                db_column="user_role_id",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.userrole",
            ),
        ),
        migrations.AlterField(
            model_name="userrole",
            name="tenant_id",
            field=models.ForeignKey(
                db_column="tenant_id",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.tenant",
            ),
        ),
        migrations.CreateModel(
            name="Opportunity",
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
                ("account_id", models.CharField(max_length=255)),
                ("name", models.CharField(max_length=255)),
                ("amount", models.CharField(max_length=255)),
                ("probability", models.FloatField()),
                ("close_date", models.DateTimeField()),
                ("description", models.TextField()),
                ("owner_id", models.CharField(max_length=255)),
                ("op_external_id", models.TextField()),
                ("contract_id", models.CharField(max_length=255)),
                ("contract_link", models.CharField(max_length=255)),
                (
                    "stage_id",
                    models.ForeignKey(
                        db_column="stage_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.opportunitystage",
                    ),
                ),
                (
                    "type_id",
                    models.ForeignKey(
                        db_column="type_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="api.opportunitytype",
                    ),
                ),
            ],
            options={
                "db_table": "opportunity",
            },
        ),
        migrations.CreateModel(
            name="Account",
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
                ("name", models.TextField()),
                ("number", models.CharField(max_length=255)),
                ("description", models.TextField(null=True)),
                ("owner_id", models.CharField(max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("annual_revenue", models.FloatField()),
                ("no_of_employees", models.IntegerField()),
                ("funding_amount", models.IntegerField()),
                ("industry", models.TextField()),
                ("ownership", models.TextField(null=True)),
                ("upsell_opportunity", models.TextField(null=True)),
                ("year_started", models.TextField(null=True)),
                ("site", models.CharField(max_length=255, null=True)),
                ("website", models.TextField(null=True)),
                ("account_ext_key", models.TextField(null=True)),
                (
                    "billing_address_id",
                    models.ForeignKey(
                        db_column="billing_address_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="billing_accounts",
                        to="api.address",
                    ),
                ),
                (
                    "shipping_address_id",
                    models.ForeignKey(
                        db_column="shipping_address_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="shipping_accounts",
                        to="api.address",
                    ),
                ),
            ],
            options={
                "db_table": "account",
            },
        ),
    ]
