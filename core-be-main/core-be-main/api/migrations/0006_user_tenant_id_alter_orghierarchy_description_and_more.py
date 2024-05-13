from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0005_address_opportunitystage_opportunitytype_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="tenant_id",
            field=models.ForeignKey(
                db_column="tenant_id",
                default=None,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.tenant",
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="orghierarchy",
            name="description",
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="userrole",
            name="description",
            field=models.CharField(max_length=100, null=True),
        ),
    ]
