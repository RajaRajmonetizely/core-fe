# Generated by Django 4.2.1 on 2023-08-01 10:51

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0039_alter_user_alias_alter_user_nickname_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_monetizely_user",
            field=models.BooleanField(default=False),
        ),
    ]