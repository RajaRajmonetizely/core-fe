# Generated by Django 4.2.1 on 2023-09-11 11:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0063_pricing_structure_reformart_10"),
    ]

    operations = [
        migrations.AddField(
            model_name="contractsignature",
            name="is_canceled",
            field=models.BooleanField(default=False),
        ),
    ]