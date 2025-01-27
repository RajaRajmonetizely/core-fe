# Generated by Django 4.2.1 on 2023-07-26 11:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0034_pricing_structure_reformat_5"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="bill_to_name",
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="contact_name",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="account",
            name="email",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="account",
            name="quote_to_address",
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="quote_to_name",
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="ship_to_name",
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AddField(
            model_name="quote",
            name="expiration_date",
            field=models.DateField(null=True),
        ),
    ]
