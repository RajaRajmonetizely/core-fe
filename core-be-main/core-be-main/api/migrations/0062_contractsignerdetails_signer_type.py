# Generated by Django 4.2.1 on 2023-09-08 05:25

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0061_pricing_structure_reformart_9"),
    ]

    operations = [
        migrations.AddField(
            model_name="contractsignerdetails",
            name="signer_type",
            field=models.CharField(max_length=100, null=True),
        ),
    ]