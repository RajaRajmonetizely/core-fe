import copy
import io
import re
import sys

import cexprtk

from api.utils.logger import logger
from .builtin_func import builtin_types_and_functions
from api.utils.custom_exception_handler import MetricLimitException


class FormulaCalculator:
    @staticmethod
    def get_lookup(formula):
        formula = formula.replace("$", "")
        match = re.search(r"lookup\(([^)]*)\)\{[^}]*\}", formula)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def get_formula(formula):
        if not FormulaCalculator.get_lookup(formula):
            return formula.replace("$", "")
        start_index = formula.index("{") + 1
        end_index = len(formula) - 1
        extracted_text = formula[start_index:end_index]
        return extracted_text.replace("$", "")

    @staticmethod
    def get_row_from_range(data, quantity, metric_key, is_curve=False):
        # Reference - https://stackoverflow.com/questions/2465921/how-to-copy-a-dictionary-and-only-edit-the-copy
        if data and isinstance(data[0].get(metric_key), dict):
            for item in data:
                if item[metric_key]["low"] <= quantity <= item[metric_key]["high"]:
                    return copy.deepcopy(item)
        else:
            for item in data:
                if item.get(metric_key) and quantity > int(item.get(metric_key)):
                    continue
                return copy.deepcopy(item)
        if not is_curve:
            if data and isinstance(data[0].get(metric_key), dict):
                low_value = data[0][metric_key]["low"]
                high_value = data[len(data) - 1][metric_key]["high"]
                raise MetricLimitException(
                    f"Metric Range Exceeded. Please enter quantity between {low_value} and {high_value}"
                )
            high_value = data[len(data) - 1][metric_key]
            raise MetricLimitException(
                f"Metric Range Exceeded. Please enter quantity upto {high_value}"
            )

    @staticmethod
    def get_filtered_item(item):
        return {
            k: v for k, v in item.items() if isinstance(v, int) or isinstance(v, float)
        }

    @staticmethod
    def check_for_if_else(formula):
        if "if" in formula:
            return True
        return False

    @staticmethod
    def evaluate_formula(formula, item):
        try:
            symbol_table = cexprtk.Symbol_Table(item)
            result = cexprtk.Expression(formula, symbol_table)
            if FormulaCalculator.check_for_if_else(formula):
                result()
                return result.results()[0]
            return result()
        except cexprtk._exceptions.ParseException as err:
            raise err

    @staticmethod
    def calculate(columns, data, quantity_dict, is_curve=False, discounted_units=None):
        output_columns = [
            {
                "key": item["key"],
                "formula": item.get("formula", ""),
                "is_code_editor": item.get("is_code_editor", ""),
                "advance_formula": item.get("advance_formula", ""),
            }
            for item in columns
            if item.get("is_output_column")
        ]
        intermediate_columns = [
            {
                "key": item["key"],
                "formula": item.get("formula", ""),
                "is_code_editor": item.get("is_code_editor", ""),
                "advance_formula": item.get("advance_formula", ""),
            }
            for item in columns
            if item.get("is_intermediate_column")
        ]
        for quantity in quantity_dict:
            if not quantity_dict[quantity]:
                quantity_dict[quantity] = 0
        output_dict = {"final_output": 0}
        for item in output_columns:
            if item["is_code_editor"]:
                output_dict.update({item["key"]: 0})
                metric_key = FormulaCalculator.get_metric_key(item["advance_formula"])
                lookup_row = {}
                if metric_key and metric_key in quantity_dict:
                    lookup_row = FormulaCalculator.get_row_from_range(
                        data=data,
                        metric_key=metric_key,
                        quantity=quantity_dict[metric_key],
                        is_curve=is_curve,
                    )
                intermediate_variables = {}
                if discounted_units:
                    for data_row in data:
                        if lookup_row and lookup_row == data_row:
                            data_row.update(discounted_units)
                            break
                for i_item in intermediate_columns:
                    intermediate_op_resp = FormulaCalculator.execute_code_string(
                        formula=i_item["advance_formula"],
                        variables={
                            "rows": data,
                            "units": quantity_dict,
                            "is_curve": is_curve,
                        },
                    )
                    intermediate_variables[i_item["key"]] = intermediate_op_resp
                editor_variables = {
                    "rows": data,
                    "units": quantity_dict,
                    "is_curve": is_curve,
                }
                if intermediate_variables:
                    editor_variables.update(intermediate_variables)
                editor_response = FormulaCalculator.execute_code_string(
                    formula=item["advance_formula"], variables=editor_variables
                )
                output_dict.update({item["key"]: editor_response})
            else:
                metric_key = FormulaCalculator.get_lookup(item["formula"])
                if metric_key:
                    output_formula = FormulaCalculator.get_formula(item["formula"])
                    lookup_row = {}
                    for quantity in quantity_dict:
                        if quantity in metric_key:
                            lookup_row = FormulaCalculator.get_row_from_range(
                                data=data,
                                quantity=quantity_dict[quantity],
                                metric_key=metric_key,
                                is_curve=is_curve,
                            )
                            if lookup_row:
                                if discounted_units:
                                    lookup_row.update(discounted_units)
                                lookup_row.update({quantity: quantity_dict[quantity]})
                            break
                    if lookup_row:
                        filtered_item = FormulaCalculator.get_filtered_item(lookup_row)
                        for i_item in intermediate_columns:
                            if i_item["key"] in output_formula:
                                intermediate_formula = FormulaCalculator.get_formula(
                                    intermediate_columns[i_item["formula"]]
                                )
                                i_value = FormulaCalculator.evaluate_formula(
                                    formula=intermediate_formula, item=filtered_item
                                )
                                filtered_item.update({i_item["key"]: i_value})
                        if filtered_item:
                            result = FormulaCalculator.evaluate_formula(
                                formula=output_formula, item=filtered_item
                            )
                            output_dict.update({item["key"]: result})
                    else:
                        output_dict.update({item["key"]: 0})
        for _, value in output_dict.items():
            output_dict["final_output"] += value
        return output_dict

    @staticmethod
    def execute_code_string(formula, variables):
        try:
            logger.info("Code Execution via Editor for formula %s", formula)
            # Create a StringIO object to capture the output
            captured_output = io.StringIO()
            sys.stdout = captured_output  # Redirect stdout

            compiled_code = compile(formula, "<string>", "exec")
            variables.update({"__builtins__": builtin_types_and_functions})
            exec(compiled_code, variables)

            # Get the captured output
            print(variables["result"])
            output = captured_output.getvalue()
            return eval(output)
        except Exception as e:
            logger.info("An error occurred: %s", e)
            return 0
        finally:
            sys.stdout = sys.__stdout__

    @staticmethod
    def get_metric_key(formula):
        match_single_braces = re.search(r"metric_key\s*=\s*\'(.+?)\'", formula)
        if match_single_braces:
            metric_key = match_single_braces.group(1)
            return metric_key
        else:
            match_double_braces = re.search(r"metric_key\s*=\s*\"(.+?)\"", formula)
            metric_key = match_double_braces.group(1)
            return metric_key
