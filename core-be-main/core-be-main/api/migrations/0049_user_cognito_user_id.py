# Generated by Django 4.2.1 on 2023-08-09 12:16

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0048_pricing_structure_reformart_7"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="cognito_user_id",
            field=models.CharField(max_length=100, null=True),
        ),
    ]
