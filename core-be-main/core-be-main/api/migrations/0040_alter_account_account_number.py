# Generated by Django 4.2.1 on 2023-08-01 11:20

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0039_alter_user_alias_alter_user_nickname_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="account",
            name="account_number",
            field=models.CharField(max_length=255, null=True),
        ),
    ]
