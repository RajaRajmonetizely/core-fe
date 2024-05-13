from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("api", "0003_pricingmodel_pricing_structure_id_and_more"),
        ]

    operations = [
        migrations.CreateModel(
            name="OrgHierarchy",
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
                ("name", models.CharField(max_length=100)),
                ("description", models.CharField(max_length=100)),
                (
                    "parent_id",
                    models.ForeignKey(
                        db_column="parent_id",
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.orghierarchy",
                    ),
                ),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.orghierarchy",
                    ),
                ),
            ],
            options={
                "db_table": "org_hierarchy",
            },
        ),
        migrations.CreateModel(
            name="Tenant",
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
                "db_table": "tenant",
            },
        ),
        migrations.CreateModel(
            name="UserRole",
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
                ("name", models.CharField(max_length=100)),
                ("description", models.CharField(max_length=100)),
                (
                    "tenant_id",
                    models.ForeignKey(
                        db_column="tenant_id",
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.tenant",
                    ),
                ),
            ],
            options={
                "db_table": "user_role",
            },
        ),
        migrations.CreateModel(
            name="User",
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
                ("is_active", models.BooleanField(default=True)),
                ("alias", models.CharField(max_length=255)),
                ("name", models.CharField(max_length=255)),
                ("photo_url", models.CharField(max_length=255, null=True)),
                ("email", models.CharField(max_length=255)),
                ("username", models.CharField(max_length=255)),
                ("nickname", models.CharField(max_length=255)),
                ("federation_id", models.CharField(max_length=255, null=True)),
                ("user_licence_id", models.CharField(max_length=255, null=True)),
                (
                    "manager_id",
                    models.ForeignKey(
                        db_column="manager_id",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.user",
                    ),
                ),
                (
                    "org_hierarchy_id",
                    models.ForeignKey(
                        db_column="org_hierarchy_id",
                        default=None,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.orghierarchy",
                    ),
                ),
                (
                    "user_role_id",
                    models.ForeignKey(
                        db_column="user_role_id",
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="api.userrole",
                    ),
                ),
            ],
            options={
                "db_table": "user",
            },
        ),
    ]
