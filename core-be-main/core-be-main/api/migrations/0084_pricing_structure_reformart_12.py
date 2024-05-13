import json
from django.db import migrations

linear_string = """
metric_key = 'metric_range'

def linear_model(metric, lookup_value):
    for item in rows:
        if item[metric]["low"] <= lookup_value <= item[metric]["high"]:
            return item["transaction_fee"] * lookup_value

result = linear_model(metric_key, units[metric_key])
"""

two_part_formula_platform_fee_string = """
metric_key = 'metric_range'

def two_part_formula_platform_fee(metric, lookup_value):
    for item in rows:
        if item[metric]["low"] <= lookup_value <= item[metric]["high"]:
            return item["transaction_fee"] * lookup_value + item["platform_fee"]

result = two_part_formula_platform_fee(metric_key, units[metric_key])
"""

two_part_formula_minimum_commit_string = """
metric_key = 'metric_range'

def two_part_formula_minimum_commit(metric, lookup_value):
    for item in rows:
        if item[metric]["low"] <= lookup_value <= item[metric]["high"]:
            return max(item["transaction_fee"] * lookup_value, item["transaction_fee"] * item["minimum_committed_units"])
result = two_part_formula_minimum_commit(metric_key, units[metric_key])
"""

three_part_string = """
metric_key = 'upto_unit_range'

def three_part(metric, lookup_value):
    for item in rows:
        if lookup_value > int(item[metric]):
            continue
        return item, rows.index(item)
output, row_index = three_part(metric_key, units[metric_key])

if is_curve:
    if row_index == 0:
        result = output['platform_fee']
    else:
        prev_item = rows[row_index-1]
        result = min(output['platform_fee'], prev_item['platform_fee'] + prev_item['overage_fee'] * (units['upto_unit_range'] - prev_item['upto_unit_range']))
else:
    result = output['platform_fee']
"""


def migrate_pricing_structure_format12(apps, schema_editor):
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
                "Output": True,
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
                "Output": True,
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
                "Output": True,
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
                "Output": True,
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
                        {"name": "low", "key": "low"},
                        {"name": "high", "key": "high"},
                    ],
                    "key": "metric_range",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": True,
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
                    "is_upto_column": True,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )

        if fields["Transaction fee per unit"]:
            details_data.append(
                {
                    "name": "Transaction fee",
                    "sub_columns": [],
                    "key": "transaction_fee",
                    "is_input_column": True,
                    "is_unit_column": True,
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
                    "name": "Overage fee",
                    "sub_columns": [],
                    "key": "overage_fee",
                    "is_input_column": True,
                    "is_output_column": False,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": False,
                    "formula": None,
                }
            )
        if fields["Output"]:
            if name == "Linear Model":
                formula = "lookup($metric_range){$transaction_fee * $metric_range}"
                advance_formula = linear_string
            elif name == "Two Part formula with platform fee":
                formula = "lookup($metric_range){($transaction_fee * $metric_range) + $platform_fee}"
                advance_formula = two_part_formula_platform_fee_string
            elif name == "Two Part formula with minimum commit":
                formula = "lookup($metric_range){max($transaction_fee * $metric_range, $transaction_fee * $minimum_committed_units)}"
                advance_formula = two_part_formula_minimum_commit_string
            elif name == "Three part formula":
                formula = "lookup($upto_unit_range){$platform_fee}"
                advance_formula = three_part_string
            else:
                formula = ""
                advance_formula = ""
            details_data.append(
                {
                    "name": "Output",
                    "sub_columns": [],
                    "key": "output",
                    "is_input_column": True,
                    "is_output_column": True,
                    "is_metric_column": False,
                    "metric_id": None,
                    "has_formula": True,
                    "is_code_editor": True if name == "Three part formula" else False,
                    "advance_formula": advance_formula,
                    "formula": formula,
                }
            )

        # Update details_data with custom formulas
        custom_formula = None
        if name == "Linear Model":
            custom_formula = "lookup($metric_range){$transaction_fee * $metric_range}"

        if name == "Two Part formula with platform fee":
            custom_formula = "lookup($metric_range){($transaction_fee * $metric_range) + $platform_fee}"

        if name == "Two Part formula with minimum commit":
            custom_formula = "lookup($metric_range){max($transaction_fee * $metric_range, $transaction_fee * $minimum_committed_units)}"

        if name == "Three part formula":
            custom_formula = "lookup($upto_unit_range){$platform_fee}"

        PricingStructure.objects.filter(name=name).update(
            custom_formula=custom_formula,
            details=json.dumps(details_data),
        )



class Migration(migrations.Migration):
    dependencies = [
        ("api", "0083_contract_signed_file_path"),
    ]

    operations = [migrations.RunPython(migrate_pricing_structure_format12)]
