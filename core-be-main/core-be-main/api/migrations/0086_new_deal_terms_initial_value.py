# Generated by Django 4.2.1 on 2023-10-09 13:08
import json

from django.db import migrations


def migrate_deal_terms(apps, schema_editor):
    default_deal_terms = apps.get_model("api", "TenantConfig")
    data = [
        {
            "component": "text-field",
            "name": 'account_name',
            "label": 'Account Name',
            "FormFieldGridProps": {"xs": 4, "p": 2},
        },
        {
            "component": "select",
            "name": "contract_length",
            "label": 'Contract Length',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "initialValue": '1 year',
            "options": [
                {
                    "label": '3 months',
                    "value": '3 months',
                },
                {
                    "label": '6 months',
                    "value": '6 months',
                },
                {
                    "label": '1 year',
                    "value": '1 year',
                },
                {
                    "label": '2 years',
                    "value": '2 years',
                },
                {
                    "label": '3 years',
                    "value": '3 years',
                },
                {
                    "label": '4 years',
                    "value": '4 years',
                },
            ],
            "isSearchable": True,
            "isClearable": True,
        },
        {
            "component": "select",
            "name": 'billing_frequency',
            "label": 'Billing Frequency',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "initialValue": 'monthly',
            "options": [
                {
                    "label": 'Weekly',
                    "value": 'weekly',
                },
                {
                    "label": 'Bi-Weekly',
                    "value": 'bi-weekly',
                },
                {
                    "label": 'Monthly',
                    "value": 'monthly',
                },
                {
                    "label": 'Bi-Monthly',
                    "value": 'bi-monthly',
                },
                {
                    "label": 'Quarterly',
                    "value": 'quarterly',
                },
                {
                    "label": 'Half-Yearly',
                    "value": 'half-yearly',
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
            "component": "select",
            "name": 'payment_terms',
            "label": 'Payment Terms',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
            "initialValue": 'Net 15',
            "options": [
                {
                    "label": 'Net 15',
                    "value": 'Net 15',
                },
                {
                    "label": 'Net 30',
                    "value": 'Net 30',
                },
                {
                    "label": 'Net 45',
                    "value": 'Net 45',
                },
                {
                    "label": 'Net 60',
                    "value": 'Net 60',
                },
            ],
        },
        {
            "component": "date-picker",
            "name": 'contract_start',
            "DatePickerProps": {"format": 'dd/MM/yyyy'},
            "label": 'Contract Start',
            "FormFieldGridProps": {"xs": 4, "p": 2, "marginTop": -2},
        },
    ]
    default_deal_terms.objects.all().delete()
    default_deal_terms.objects.create(config=json.dumps(data))


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0085_new_deal_terms"),
    ]

    operations = [
        migrations.RunPython(migrate_deal_terms),
    ]