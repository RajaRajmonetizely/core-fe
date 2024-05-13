# Generated by Django 4.2.1 on 2023-06-08 13:44

# Generated by Django 4.2.1 on 2023-06-01 10:30
import json

from django.db import migrations


def migrate_pricing_structure(apps, schema_editor):
    PricingStructure = apps.get_model("api", "PricingStructure")

    data = [
        {
            "name": "Linear Model",
            "fields": {
                "To-From Unit Range": True,
                "Upto Unit Range": False,
                "Transaction fee per unit": True,
                "Platform Fee": False,
                "Minimum Committed Units": False,
                "Overage fee per unit": True,
            },
        },
        {
            "name": "Two Part formula with platform fee",
            "fields": {
                "To-From Unit Range": True,
                "Upto Unit Range": False,
                "Transaction fee per unit": True,
                "Platform Fee": True,
                "Minimum Committed Units": False,
                "Overage fee per unit": True,
            },
        },
        {
            "name": "Two Part formula with minimum commit",
            "fields": {
                "To-From Unit Range": True,
                "Upto Unit Range": False,
                "Transaction fee per unit": True,
                "Platform Fee": False,
                "Minimum Committed Units": True,
                "Overage fee per unit": True,
            },
        },
        {
            "name": "Three part formula",
            "fields": {
                "To-From Unit Range": False,
                "Upto Unit Range": True,
                "Transaction fee per unit": False,
                "Platform Fee": True,
                "Minimum Committed Units": False,
                "Overage fee per unit": True,
            },
        },
    ]

    for item in data:
        name = item["name"]
        fields = item["fields"]

        details_data = []

        if fields["To-From Unit Range"]:
            details_data.append(
                {
                    "name": "Metric range",
                    "sub_columns": [
                        {"name": "low", "key": "metric_low"},
                        {"name": "high", "key": "metric_high"},
                    ],
                    "key": "metric_range",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Upto Unit Range"]:
            details_data.append(
                {
                    "name": "Upto Unit Range",
                    "sub_columns": [],
                    "key": "upto_unit_range",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Transaction fee per unit"]:
            details_data.append(
                {
                    "name": "Transaction fee per unit",
                    "sub_columns": [],
                    "key": "transaction_fee_per_unit",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Platform Fee"]:
            details_data.append(
                {
                    "name": "Platform fee",
                    "sub_columns": [],
                    "key": "platform_fee",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Minimum Committed Units"]:
            details_data.append(
                {
                    "name": "Minimum Committed Units",
                    "sub_columns": [],
                    "key": "minimum_committed_units",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Overage fee per unit"]:
            details_data.append(
                {
                    "name": "Overage fee per unit",
                    "sub_columns": [],
                    "key": "overage_fee_per_unit",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        # Update details_data with custom formulas
        if name == "Linear Model":
            custom_formula = "For(Lookup row(To-From Unit Range(unit))) { price = $/unit transaction fee * units)}"

        if name == "Two Part formula with platform fee":
            custom_formula = "For(Lookup row(To-From Unit Range(unit))) { price = $/unit transaction fee * units + platform fee)}"

        if name == "Two Part formula with minimum commit":
            custom_formula = "For(Lookup row(To-From Unit Range(unit))) { price = $/unit transaction fee * minimum committed units  +  $/unit transaction fee * units)}"

        if name == "Three part formula":
            custom_formula = "Minimum of { If ( Lookuprow(Upto Unit Range(unit)) is TRUE, For(row) ( Price = Platform Fee )) OR For(Lookuprow(Upto Unit Range(unit)) - 1) { Price = Platform Fee + $/unit Overage fee * (Unit - Upto Unit Range) }}"

        PricingStructure.objects.create(
            name=name,
            pricing_model_id=None,
            custom_formula=custom_formula,
            details=json.dumps(details_data),
        )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(migrate_pricing_structure),
    ]
