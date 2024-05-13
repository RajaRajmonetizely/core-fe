import json
import os

from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.viewsets import ViewSet

from api.account.models import Contract, Opportunity
from api.auth.authentication import CognitoAuthentication
from api.contract.serializers.contract import ContractSerializer
from api.document.models import ContractTemplate
from api.feature_repository.models import Feature, FeatureGroup
from api.package.models import PackageDetail
from api.pricebook.models import PriceBookEntry
from api.pricing.models import PricingModelDetails
from api.pricing_calculator.models import Quote, QuoteDetails
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email
from api.utils.aws_utils.s3 import S3Service
from api.utils.custom_exception_handler import (
    ContractTemplateNotFoundException, OpportunityDoesNotExistsException,
    QuoteDoesNotExistsException)
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder
from api.utils.template.doctopdf import DocxToPdfConverter


class ContractViewSet(ViewSet):
    authentication_classes = [CognitoAuthentication]

    def transform_data(quote_id, tenant_id):
        """
        Transform quote data into a structured context for contract generation.

        Args:
            quote_id (int): The ID of the quote to transform.

        Returns:
            dict: A structured context containing quote and related data.

        Raises:
            QuoteDoesNotExistsException: If the quote with the specified ID does not exist.
        """
        try:
            quote_obj = Quote.objects.filter(
                id=quote_id, tenant_id=tenant_id, is_deleted=False
            ).first()

            if not quote_obj:
                raise QuoteDoesNotExistsException("Quote Does Not Exist")

            context = {
                "account": {
                    "name": quote_obj.account_id.name,
                    "description": quote_obj.account_id.description,
                    "number": quote_obj.account_id.account_number,
                    "site": quote_obj.account_id.site,
                    "website": quote_obj.account_id.website,
                    "billing_city": quote_obj.account_id.billing_city,
                    "billing_country": quote_obj.account_id.billing_country,
                    "billing_postal_code": quote_obj.account_id.billing_postal_code,
                    "billing_state": quote_obj.account_id.billing_state,
                    "billing_street": quote_obj.account_id.billing_street,
                    "shipping_city": quote_obj.account_id.shipping_city,
                    "shipping_country": quote_obj.account_id.shipping_country,
                    "shipping_postal_code": quote_obj.account_id.shipping_postal_code,
                    "shipping_state": quote_obj.account_id.shipping_state,
                    "shipping_street": quote_obj.account_id.shipping_street,
                    "bill_to_name": quote_obj.account_id.bill_to_name,
                    "ship_to_name": quote_obj.account_id.ship_to_name,
                    "quote_to_name": quote_obj.account_id.quote_to_name,
                    "quote_to_address": quote_obj.account_id.quote_to_address,
                    "contact_name": quote_obj.account_id.contact_name,
                    "email": quote_obj.account_id.email,
                },
                "opportunity": {
                    "name": quote_obj.opportunity_id.name
                    if quote_obj.opportunity_id
                    else None,
                    "description": quote_obj.opportunity_id.description
                    if quote_obj.opportunity_id
                    else None,
                    "stage": quote_obj.opportunity_id.stage_id.name
                    if quote_obj.opportunity_id and quote_obj.opportunity_id.stage_id
                    else None,
                    "type": quote_obj.opportunity_id.type_id.name
                    if quote_obj.opportunity_id and quote_obj.opportunity_id.type_id
                    else None,
                },
                "deal_terms": {"deal_term_columns": [], "deal_term_rows": []},
                "quote": {
                    "quote_name": quote_obj.name,
                    "quote_number": quote_obj.quote_number,
                    "quote_url": quote_obj.quote_url,
                },
                "contract_data": {
                    "quote_object": quote_obj,
                    "account_object": quote_obj.account_id,
                    "opportunity_object": quote_obj.opportunity_id,
                },
                "products": [],
            }

            if quote_obj.deal_term_details:
                deal_terms = json.loads(quote_obj.deal_term_details)
                context["deal_terms"]["deal_term_columns"] = list(deal_terms.keys())
                context["deal_terms"]["deal_term_rows"].append(
                    {"deal_term_row_column": list(deal_terms.values())}
                )

            pricebook_entries = PriceBookEntry.objects.filter(
                price_book_id=quote_obj.price_book_id, is_deleted=False
            )
            pricebook_entries_dict = {
                entry.product_id.id: entry for entry in pricebook_entries
            }

            quote_details = QuoteDetails.objects.filter(
                quote_id=quote_id, is_deleted=False
            )
            for item in quote_details:
                product_data = ContractViewSet.build_product_data(
                    item, quote_obj, pricebook_entries_dict
                )
                context["products"].append(product_data)

            return context

        except Exception as e:
            raise Exception("Quote has invalid data")

    def build_product_data(quote_detail, quote_obj, pricebook_dict):
        item = quote_detail
        product_data = {
            "name": item.product_id.name,
            "description": item.product_id.description,
            "plan_name": item.tier_id.plan_id.name,
            "total_price": quote_obj.total_price,
            "discount": quote_obj.discount,
        }

        pricebook_details = pricebook_dict.get(item.product_id.id)
        package_details = PackageDetail.objects.filter(
            package_id=pricebook_details.package_id.id, tier_id=item.tier_id.id
        ).first()
        product_data["tier"] = ContractViewSet.build_tier_data(item, quote_obj)

        data = json.loads(package_details.details)
        feature_groups, features = ContractViewSet.get_feature_data(
            data, pricebook_details.pricing_model_id.id, item.tier_id.id
        )

        product_data["package_details"] = {"feature_groups": data.get("feature_groups")}

        return product_data

    def get_feature_data(data, pricing_model_id, tier_id):
        feature_group_dict = {
            group["feature_group_id"]: group for group in data["feature_groups"]
        }
        feature_dict = {
            feature["feature_id"]: feature
            for group in data["feature_groups"]
            for feature in group["features"]
        }
        feature_groups = FeatureGroup.objects.filter(id__in=feature_group_dict.keys())
        features = Feature.objects.filter(id__in=feature_dict.keys())

        pricing_model_details = PricingModelDetails.objects.get(
            pricing_model_id=pricing_model_id, tier_id=tier_id, is_deleted=False
        )
        pricing_details = json.loads(pricing_model_details.details)

        in_scope_features = [str(tier_id)] + [
            addon_feature.get("id") for addon_feature in pricing_details["addons"]
        ]

        for group_data in data["feature_groups"]:
            feature_group = feature_groups.get(id=group_data["feature_group_id"])
            group_data["external_name"] = feature_group.external_name
            group_data["external_description"] = feature_group.external_description

            for feature_data in group_data["features"]:
                feature = features.get(id=feature_data["feature_id"])
                feature_data["external_name"] = feature.external_name
                feature_data["external_description"] = feature.external_description
                if str(feature.id) in in_scope_features:
                    feature_data["out_of_scope"] = False
                else:
                    feature_data["out_of_scope"] = True

        return feature_groups, features

    def build_tier_data(item, quote):
        tiers = {}

        contract_config = ContractViewSet.get_contract_specific_details(quote, item)
        tiers["contract_specific_config"] = contract_config

        details = json.loads(item.details)
        if details.get("core"):
            tier_details = details.get("core")
            for row in tier_details.get("rows", []):
                core_data = {
                    "tier_name": item.tier_id.name,
                    "quantity": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "qty"
                        ),
                        None,
                    ),
                    "list_total_price": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "list_total_price"
                        ),
                        None,
                    ),
                    "discount_percent": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "discount"
                        ),
                        None,
                    ),
                    "discounted_total_price": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "discounted_total_price"
                        ),
                        None,
                    ),
                }
                tiers["core"] = core_data

        addons_list = []
        addons = details.get("addons")
        if addons:
            for row in addons.get("rows", []):
                addon_name = Feature.objects.get(
                    id=row.get("addon_id"), is_deleted=False
                )
                addon_data = {
                    "tier_name": addon_name.name,
                    "quantity": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "qty"
                        ),
                        None,
                    ),
                    "list_total_price": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "list_total_price"
                        ),
                        None,
                    ),
                    "discount_percent": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "discount"
                        ),
                        None,
                    ),
                    "discounted_total_price": next(
                        (
                            value["value"]
                            for value in row["values"]
                            if value["key"] == "discounted_total_price"
                        ),
                        None,
                    ),
                }
                addons_list.append(addon_data)

        tiers["addons"] = addons_list
        return tiers

    def get_contract_specific_details(quote, quote_detail):
        if quote.config_details:
            config_details = json.loads(quote.config_details)
            product_id = str(quote_detail.product_id.id)
            tier_id = str(quote_detail.tier_id.id)

            # Initialize variables to store the extracted data
            selected_columns = []
            rows = []

            # Create a set of selected column keys for faster membership checking
            selected_column_keys = set()

            # Iterate through the data to find the specified product_id and tier_id
            for product_data in config_details:
                if product_data["product_id"] == product_id:
                    for tier_data in product_data["tiers"]:
                        if tier_data["tier_id"] == tier_id:
                            # Extract columns and values
                            columns = tier_data["details"]["columns"]
                            values_list = tier_data["details"]["values"]

                            # Iterate through columns to create the header row
                            sub_column_names = {}
                            for column in columns:
                                if (
                                    column.get("sub_columns")
                                    and len(column.get("sub_columns")) > 0
                                ):
                                    for sub_col in column["sub_columns"]:
                                        if sub_col.get("is_selected", False):
                                            sub_column_names[
                                                sub_col["key"]
                                            ] = f"{column['name']} {sub_col['name']}"
                                            selected_columns.append(
                                                sub_column_names[sub_col["key"]]
                                            )

                                            # Add the column key to the selected column keys set
                                            selected_column_keys.add(column["key"])
                                else:
                                    if column.get("is_selected", False):
                                        # Add the main column name to the header row
                                        selected_columns.append(column["name"])
                                        # Add the column key to the selected column keys set
                                        selected_column_keys.add(column["key"])

                            # Iterate through values_list to create multiple rows
                            for values in values_list:
                                if values.get("is_selected", False):
                                    # Initialize a row with None values
                                    selected_row = [None] * len(selected_columns)

                                    # Fill in the values for selected columns and sub-columns
                                    for column in columns:
                                        column_key = column["key"]
                                        if column_key in selected_column_keys:
                                            if column.get("sub_columns"):
                                                # Handle the "Metric range" column with sub-columns
                                                for sub_col in column["sub_columns"]:
                                                    if sub_col.get(
                                                        "is_selected", False
                                                    ):
                                                        sub_column_key = sub_col["key"]
                                                        sub_column_index = (
                                                            selected_columns.index(
                                                                sub_column_names[
                                                                    sub_column_key
                                                                ]
                                                            )
                                                        )
                                                        selected_row[
                                                            sub_column_index
                                                        ] = values[column_key][
                                                            sub_column_key
                                                        ]
                                            else:
                                                # Handle other columns
                                                column_index = selected_columns.index(
                                                    column["name"]
                                                )
                                                selected_row[column_index] = values.get(
                                                    column_key, None
                                                )

                                    rows.append(
                                        {
                                            "contract_specific_config_row_column": selected_row
                                        }
                                    )

            # Create the 'config_details' dictionary
            contract_specific_config = {
                "contract_specific_config_columns": selected_columns,
                "contract_specific_config_rows": rows,  # Add multiple rows to the "row" list
            }
            return contract_specific_config

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "quote_id",
                openapi.IN_QUERY,
                description="Quote id for which contract has to be generated",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
            openapi.Parameter(
                "contract_template_id",
                openapi.IN_QUERY,
                description="Template id one which the quote is going to be generated",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def create(self, request, *args, **kwargs):
        """
        Generate a contract based on a quote and template.

        Args:
            request (Request): The HTTP request object.
            args: Additional positional arguments.
            kwargs: Additional keyword arguments.

        Returns:
            Response: The HTTP response containing contract data or an error message.
        """
        try:
            logger.info("Contract Generation invoked!")
            tenant_id = get_tenant_id_from_email(request.user[0])
            quote_id = request.query_params.get("quote_id")
            contract_template_id = request.query_params.get("contract_template_id")

            # Fetch data based on quote_id (You might need to implement this)
            quote_data = ContractViewSet.transform_data(quote_id, tenant_id)

            contract_related_data = quote_data.pop("contract_data")

            # Generate a fixed contract number or use the existing one
            quote = contract_related_data.get("quote_object")
            if quote.contract_id:
                contract_number = quote.contract_id.contract_number
            else:
                contract_number = ContractViewSet.generate_contract_number(tenant_id)

            quote_data["contract_number"] = contract_number

            # Get the input S3 URL from your template_path_url
            template_object = ContractTemplate.objects.filter(
                id=contract_template_id, tenant_id=tenant_id, is_deleted=False
            ).first()
            if not template_object:
                raise ContractTemplateNotFoundException("Contract Template not found")
            template_s3_url = template_object.s3_doc_file_path

            # Remove the filename and extension from the end of the S3 path
            output_dir, _ = os.path.split(template_s3_url)
            output = output_dir
            quote_details = quote_data.get("quote")
            # Create an instance of DocxToPdfConverter
            converter = DocxToPdfConverter()
            template_filename = (
                f"{quote_details.get('quote_name')}_{template_object.name}"
            )
            template_filename = template_filename.replace(" ", "_")

            contract_name = f"contract_{quote_details.get('quote_name')}"
            contract_name = contract_name.replace(" ", "_")
            # Process the template and get the success status, message, and output S3 path
            (
                success,
                response_message,
                output_path,
                signature_count,
            ) = converter.process_contract_template_to_pdf(
                template_s3_url, output, quote_data, template_filename
            )

            # Create a Contract instance
            if success:
                quote = Quote.objects.filter(id=quote_id, is_deleted=False).first()
                if quote.contract_id:
                    contract = Contract.objects.get(
                        id=quote.contract_id.id, is_deleted=False
                    )
                    if contract.s3_file_path and contract.s3_file_path != output_path:
                        S3Service.delete_s3_object(contract.s3_file_path)
                    contract.s3_file_path = output_path
                    contract.template_id = template_object
                    contract.status = None
                    contract.signer_count = json.dumps(signature_count)
                    contract.contract_url = os.getenv("CONTRACT_URL")
                    contract.save()
                else:
                    opportunity = Opportunity.objects.filter(
                        id=contract_related_data.get("opportunity_object").id,
                        is_deleted=False,
                        tenant_id=tenant_id,
                    ).first()

                    if not opportunity:
                        raise OpportunityDoesNotExistsException("Opportunity not found")

                    if opportunity.contract_id and opportunity.op_external_id:
                        contract_id = opportunity.contract_id.id
                        contract = Contract.objects.get(
                            id=contract_id, is_deleted=False
                        )
                        contract.signer_count = json.dumps(signature_count)
                        if (
                            contract.s3_file_path
                            and contract.s3_file_path != output_path
                        ):
                            S3Service.delete_s3_object(contract.s3_file_path)
                        contract.s3_file_path = output_path
                        contract.status = None
                        contract.contract_url = os.getenv("CONTRACT_URL")
                        contract.save()
                    else:
                        # TODO: Need to update contract link
                        # Create a Contract instance
                        contract = Contract(
                            account_id=contract_related_data.get("account_object"),
                            name=contract_name,
                            contract_number=contract_number,
                            tenant_id=Tenant.objects.get(
                                id=tenant_id, is_deleted=False
                            ),
                            s3_file_path=output_path,
                            contract_url=os.getenv("CONTRACT_URL"),
                            signer_count=json.dumps(signature_count),
                            template_id=template_object,
                            status=None,
                        )
                        contract.save()

                    quote = Quote.objects.filter(id=quote_id, is_deleted=False).first()
                    if not quote:
                        raise QuoteDoesNotExistsException("Quote Does Not Exist")
                    quote.contract_id = contract
                    quote.save()

                # Serialize the contract object
                contract_serializer = ContractSerializer(contract)

                # Add the presigned URL to the serialized response
                response_data = contract_serializer.data
                response_data["signer_count"] = json.loads(
                    response_data["signer_count"]
                )
                return ResponseBuilder.success(
                    data=response_data, status_code=status.HTTP_200_OK
                )
            else:
                return ResponseBuilder.errors(
                    message=response_message,
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return ResponseBuilder.errors(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def generate_contract_number(tenant_id):
        """
        Generate the next contract number for the given tenant with the format 'C_000001'.

        Args:
            tenant_id (int): The ID of the tenant for whom the contract number is generated.

        Returns:
            str: The next contract number in the format 'C_000001'.

        Raises:
            Contract.DoesNotExist: If no contracts exist for the tenant.
        """
        # Query the database to find the highest contract number with the format 'C_000001'
        highest_contract = (
            Contract.objects.filter(
                tenant_id=tenant_id, contract_number__regex=r"^C_\d{6}$"
            )
            .order_by("-contract_number")
            .first()
        )

        if highest_contract:
            # Extract the numeric part of the contract number and increment it
            number_part = int(
                highest_contract.contract_number[2:]
            )  # Remove 'C_' and convert to int
            next_number_part = number_part + 1

            # Format the next contract number as 'C_000001'
            next_contract_number = f"C_{str(next_number_part).zfill(6)}"
        else:
            # If no contracts exist for the tenant, start with 'C_000001'
            next_contract_number = "C_000001"

        return next_contract_number

    def retrieve(self, request, id):
        queryset = Contract.objects.all()
        contract = get_object_or_404(queryset, pk=id)
        serializer = ContractSerializer(contract)
        response_data = serializer.data
        response_data["presigned_url"] = S3Service.generate_presigned_url(
            response_data["s3_file_path"]
        )
        return ResponseBuilder.success(
            message="success", data=response_data, status_code=status.HTTP_200_OK
        )
