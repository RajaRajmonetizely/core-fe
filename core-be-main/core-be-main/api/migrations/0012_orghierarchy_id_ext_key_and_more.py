# Generated by Django 4.2.1 on 2023-06-29 06:46

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0011_pricing_str_reformart1"),
    ]

    operations = [
        migrations.AddField(
            model_name="orghierarchy",
            name="id_ext_key",
            field=models.CharField(max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="orghierarchy",
            name="parent_role_ext_key",
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="id_ext_key",
            field=models.CharField(max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="user",
            name="manager_id_ext_key",
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="org_hierarchy_id_ext_key",
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="user_role_id_ext_key",
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="userrole",
            name="id_ext_key",
            field=models.CharField(max_length=100, null=True, unique=True),
        ),
    ]
