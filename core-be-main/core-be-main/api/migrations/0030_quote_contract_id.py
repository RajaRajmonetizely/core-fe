# Generated by Django 4.2.1 on 2023-07-20 10:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0029_delete_address"),
    ]

    operations = [
        migrations.AddField(
            model_name="quote",
            name="contract_id",
            field=models.ForeignKey(
                db_column="contract_id",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.contract",
            ),
        ),
    ]
