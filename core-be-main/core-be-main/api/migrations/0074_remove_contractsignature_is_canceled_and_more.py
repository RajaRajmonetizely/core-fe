# Generated by Django 4.2.1 on 2023-09-18 12:59

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0073_merge_20230918_1256"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contractsignature",
            name="is_canceled",
        ),
        migrations.RemoveField(
            model_name="contractsignature",
            name="is_complete",
        ),
        migrations.RemoveField(
            model_name="contractsignature",
            name="is_declined",
        ),
        migrations.AddField(
            model_name="contractsignature",
            name="status",
            field=models.CharField(
                choices=[
                    ("Draft", "Draft"),
                    ("In Approval Process", "Inapprovalprocess"),
                    ("Cancelled", "Cancelled"),
                    ("Declined", "Declined"),
                    ("Activated", "Activated"),
                    ("Expired", "Expired"),
                ],
                default="Draft",
            ),
        ),
    ]
