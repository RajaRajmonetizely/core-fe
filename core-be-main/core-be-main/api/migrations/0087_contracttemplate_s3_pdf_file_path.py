# Generated by Django 4.2.1 on 2023-10-17 06:32

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0086_new_deal_terms_initial_value"),
    ]

    operations = [
        migrations.AddField(
            model_name="contracttemplate",
            name="s3_pdf_file_path",
            field=models.CharField(default=255),
        ),
    ]