# Generated by Django 4.2.1 on 2023-07-12 10:50

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0021_remove_rolefeaturemapping_role_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="quote",
            name="status",
            field=models.CharField(default="draft", max_length=20),
        ),
    ]
