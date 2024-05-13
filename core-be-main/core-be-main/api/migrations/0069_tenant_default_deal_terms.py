# Generated by Django 4.2.1 on 2023-09-14 12:16
import json

from django.db import migrations


def migrate_deal_terms(apps, schema_editor):
    default_deal_terms = apps.get_model("api", "TenantConfig")
    data = [
        {
            "component": "componentTypes.TEXT_FIELD",
            "name": 'account_name',
            "label": 'Account Name',
            "FormFieldGridProps": {"xs": 4, "p": 2},
        },
        {
            "component": "componentTypes.SELECT",
            "name": "contract_length",
            "label": 'Contract Length',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "options": [
                {
                    "label": 'Days',
                    "value": 'days',
                },
                {
                    "label": 'Weeks',
                    "value": 'weeks',
                },
                {
                    "label": 'Months',
                    "value": 'months',
                },
                {
                    "label": 'Years',
                    "value": 'years',
                },
            ],
            "isSearchable": True,
            "isClearable": True,
        },
        {
            "component": "componentTypes.SELECT",
            "name": 'billing_frequency',
            "label": 'Billing Frequency',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "options": [
                {
                    "label": 'Weekly',
                    "value": 'weekly',
                },
                {
                    "label": 'Monthly',
                    "value": 'monthly',
                },
                {
                    "label": 'Yearly',
                    "value": 'yearly',
                },
            ],
            "isSearchable": True,
            "isClearable": True,
        },
        {
            "component": "componentTypes.SELECT",
            "name": 'payment_terms',
            "label": 'Payment Terms',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "options": [{}],
        },
        {
            "component": "componentTypes.DATE_PICKER",
            "name": 'contract_start',
            "label": 'Contract Start',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
        },
    ]
    default_deal_terms.objects.create(config=json.dumps(data))


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0068_merge_20230913_0721"),
    ]

    operations = [
        migrations.RunPython(migrate_deal_terms),
    ]