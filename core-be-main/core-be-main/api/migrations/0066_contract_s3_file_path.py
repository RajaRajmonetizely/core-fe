# Generated by Django 4.2.1 on 2023-09-12 12:58

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0065_contract_signer_count"),
    ]

    operations = [
        migrations.AddField(
            model_name="contract",
            name="s3_file_path",
            field=models.TextField(null=True),
        ),
    ]
