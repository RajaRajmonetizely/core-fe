# Generated by Django 4.2.1 on 2023-09-25 09:50

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0078_quotedetails_config_details"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="quotedetails",
            name="config_details",
        ),
        migrations.AddField(
            model_name="quote",
            name="config_details",
            field=models.JSONField(null=True),
        ),
    ]
