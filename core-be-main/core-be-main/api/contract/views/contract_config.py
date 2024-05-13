import json

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.viewsets import ViewSet

from api.auth.authentication import CognitoAuthentication
from api.plan.models import Tier
from api.pricebook.models import PriceBookEntry
from api.pricing.models import PricingModelDetails
from api.pricing_calculator.models import Quote
from api.product.models import Product
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import QuoteDoesNotExistsException
from api.utils.responses import ResponseBuilder


class ContractSpecificConfig(ViewSet):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "quote_id",
                openapi.IN_QUERY,
                description="Quote ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve or generate a contract specific configuration for a given quote.

        This method retrieves an existing product configuration for a quote from the database
        or generates a new configuration if it does not exist. It then validates and updates
        the product details based on pricebook entries, serializes the product data to JSON,
        and stores it in the database. Finally, it fetches product and tier names and updates
        the products data before returning a response.

        Args:
            request (HttpRequest): The HTTP request object.
            args: Additional positional arguments.
            kwargs: Additional keyword arguments.

        Returns:
            Response: A JSON response containing the product configuration data.
        """
        try:
            tenant_id = get_tenant_id_from_email(request.user[0])
            quote_id = request.query_params.get("quote_id")

            # Check if the quote data is already cached in the Quote table
            quote = Quote.objects.filter(
                id=quote_id, is_deleted=False, tenant_id=tenant_id
            ).first()
            if not quote:
                raise QuoteDoesNotExistsException(detail="Quote Not Found")

            if quote and quote.config_details:
                # If the data is cached, return it directly
                products = json.loads(quote.config_details)
            else:
                # Build the product structure
                products = self.build_product_structure(quote, tenant_id)

            # Validate and update product details based on pricebook_entries
            self.validate_and_update_products(products, quote, tenant_id)

            # Serialize the products data to JSON
            serialized_products = json.dumps(products)

            # Update the quote.config_details field with the serialized data
            quote.config_details = serialized_products
            quote.save()

            # Fetch product and tier names and update the products data
            response = self.fetch_and_update_names(products, tenant_id)

            return ResponseBuilder.success(
                status_code=status.HTTP_200_OK, data=response
            )
        except Exception as e:
            return ResponseBuilder.errors(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def build_product_structure(self, quote, tenant_id):
        """
        Build the product structure for the given quote based on PriceBookEntry and PricingModelDetails.

        Args:
            quote (Quote): The quote object for which the product structure is being built.

        Returns:
            list: A list of product configurations, including pricing details and columns.
        """
        products = []
        added_product_ids = set()

        # Fetch the associated PriceBookEntry for this product
        pricebook_entries = PriceBookEntry.objects.filter(
            price_book_id=quote.price_book_id, is_deleted=False, tenant_id=tenant_id
        )
        for pricebook_entry in pricebook_entries:
            product_data = {}
            if pricebook_entry:
                product_id = str(pricebook_entry.product_id.id)
                product_data["product_id"] = product_id

                if product_id in added_product_ids:
                    continue

                added_product_ids.add(product_id)

                # Fetch the PricingModelDetails for the PriceBookEntry
                pricing_model_details = PricingModelDetails.objects.filter(
                    pricing_model_id=pricebook_entry.pricing_model_id,
                    is_deleted=False,
                    tenant_id=tenant_id,
                )

                tier_data = []

                for pricing_model_detail in pricing_model_details:
                    tier_dict = {}
                    duplicated_values = {}
                    tier_dict["tier_id"] = str(pricing_model_detail.tier_id.id)

                    column_data = []
                    value_data = []

                    tier_details = json.loads(pricing_model_detail.details)
                    core_data = tier_details["core"]
                    columns = core_data["columns"]
                    values = core_data["values"]

                    for column in columns:
                        if not column.get('is_output_column'):
                            data = {
                                "name": column["name"],
                                "key": column["key"],
                                "sub_columns": column["sub_columns"],
                                "is_locked": True,
                                "is_selected": False,
                            }
                            column_data.append(data)

                        if (
                            column.get("is_input_column", False)
                            and not column.get("is_metric_column")
                            and not column.get("is_output_column")
                            and not column.get("is_upto_column")
                        ):
                            # If it's an input column, add a modified column
                            duplicated_column = {
                                "name": f"Quote Discounted {column['name']}",
                                "key": f"quote_discounted_{column['key']}",
                                "sub_columns": column["sub_columns"],
                                "is_locked": False,
                                "is_selected": False,
                            }
                            column_data.append(duplicated_column)
                            # Create or update the duplicated_value dictionary
                            duplicated_value_key = f"quote_discounted_{column['key']}"
                            duplicated_values[duplicated_value_key] = column["key"]

                    # Parse and include all values
                    for value in values:
                        # Check if any value is None before adding the dictionary to value_data
                        if any(val for val in value.values()):

                            for key, dup_key in duplicated_values.items():
                                value[key] = value.get(dup_key, None)

                            value.update({"is_selected": False})
                            value_data.append(value)

                    details_data = {"columns": column_data, "values": value_data}
                    tier_dict["details"] = details_data
                    tier_data.append(tier_dict)

                product_data["tiers"] = tier_data
            products.append(product_data)

        return products

    def validate_and_update_products(self, config_products, quote, tenant_id):
        """
        Validate and update the product configuration based on pricebook entries.

        Args:
            config_products (list): List of existing product configurations.
            quote (Quote): The quote object associated with the configuration.

        Returns:
            None
        """
        # Create a set to store product IDs in the pricebook entries
        pricebook_product_ids = set()

        # Fetch pricebook entries based on the quote's price book ID
        pricebook_entries = PriceBookEntry.objects.filter(
            price_book_id=quote.price_book_id, is_deleted=False, tenant_id=tenant_id
        )

        # Extract product details from pricebook entries
        for entry in pricebook_entries:
            pricebook_product_ids.add(str(entry.product_id.id))

        # Identify products to add and remove
        products_to_add = pricebook_product_ids - {
            product["product_id"] for product in config_products
        }
        products_to_remove = {
            product["product_id"] for product in config_products
        } - pricebook_product_ids

        # Create a list of new products to add to the configuration
        new_products = self.build_product_structure(quote, tenant_id)
        products_to_add_list = [
            product
            for product in new_products
            if product["product_id"] in products_to_add
        ]

        # Remove products not present in pricebook entries from the config
        config_products[:] = [
            product
            for product in config_products
            if product["product_id"] not in products_to_remove
        ]

        # Append new products to the config
        config_products.extend(products_to_add_list)

    def fetch_and_update_names(self, products, tenant_id):
        """
        Fetch and update product and tier names for the given products.

        This method takes a list of product configurations and updates them with the
        corresponding product and tier names fetched from the database. It gathers unique
        product and tier IDs from the products data, queries the database to fetch the names
        based on the IDs, and updates the products data with the names.

        Args:
            products (list): A list of product configurations to update.

        Returns:
            list: The updated list of product configurations with product and tier names.
        """
        # Gather all unique product and tier IDs from the products data
        product_ids = set()
        tier_ids = set()

        for product in products:
            product_id = product.get("product_id")
            if product_id:
                product_ids.add(product_id)

            tier_data = product.get("tiers", [])
            for tier in tier_data:
                tier_id = tier.get("tier_id")
                if tier_id:
                    tier_ids.add(tier_id)

        # Query the database to fetch product and tier names based on the IDs
        product_mapping = {}
        tier_mapping = {}

        # Fetch product names
        product_queryset = Product.objects.filter(
            id__in=product_ids, tenant_id=tenant_id, is_deleted=False
        )
        for product in product_queryset:
            product_mapping[str(product.id)] = product.name

        # Fetch tier names
        tier_queryset = Tier.objects.filter(
            id__in=tier_ids, tenant_id=tenant_id, is_deleted=False
        )
        for tier in tier_queryset:
            tier_mapping[str(tier.id)] = tier.name

        # Update the products data with product and tier names
        for product in products:
            product_id = product.get("product_id")
            if product_id:
                product["product_name"] = product_mapping.get(product_id, "Unknown")

            tier_data = product.get("tiers", [])
            for tier in tier_data:
                tier_id = tier.get("tier_id")
                if tier_id:
                    tier["tier_name"] = tier_mapping.get(tier_id, "Unknown")

        return products

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "quote_id",
                openapi.IN_QUERY,
                description="Quote ID",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                required=False,
            ),
        ],
        request_body=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "product_id": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        format=openapi.FORMAT_UUID,
                    ),
                    "tiers": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "tier_id": openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    format=openapi.FORMAT_UUID,
                                ),
                                "details": openapi.Schema(
                                    type=openapi.TYPE_OBJECT,
                                    properties={
                                        "columns": openapi.Schema(
                                            type=openapi.TYPE_ARRAY,
                                            items=openapi.Schema(
                                                type=openapi.TYPE_OBJECT,
                                                properties={
                                                    "name": openapi.Schema(
                                                        type=openapi.TYPE_STRING,
                                                    ),
                                                    "key": openapi.Schema(
                                                        type=openapi.TYPE_STRING,
                                                    ),
                                                    "sub_columns": openapi.Schema(
                                                        type=openapi.TYPE_ARRAY,
                                                        items=openapi.Schema(
                                                            type=openapi.TYPE_OBJECT,
                                                        ),
                                                    ),
                                                    "is_locked": openapi.Schema(
                                                        type=openapi.TYPE_BOOLEAN,
                                                    ),
                                                    "is_selected": openapi.Schema(
                                                        type=openapi.TYPE_BOOLEAN,
                                                    ),
                                                },
                                            ),
                                        ),
                                        "values": openapi.Schema(
                                            type=openapi.TYPE_ARRAY,
                                            items=openapi.Schema(
                                                type=openapi.TYPE_OBJECT,
                                                properties={
                                                    "is_selected": openapi.Schema(
                                                        type=openapi.TYPE_BOOLEAN,
                                                    ),
                                                },
                                            ),
                                        ),
                                    },
                                ),
                            },
                        ),
                    ),
                },
            ),
        ),
    )
    def update(self, request, *args, **kwargs):
        """
        Update a contract specific configuration details and perform additional actions.

        This endpoint allows updating a quote's configuration details, associating it with a specific quote ID.
        The updated configuration details are saved to the quote object, and additional actions are performed
        based on the provided data.

        Args:
            request (HttpRequest): The HTTP request object.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: A response indicating the result of the update operation.
        """
        try:
            tenant_id = get_tenant_id_from_email(request.user[0])
            config_details = request.data
            quote_id = request.query_params.get("quote_id")

            quote = Quote.objects.filter(
                id=quote_id, is_deleted=False, tenant_id=tenant_id
            ).first()
            if not quote:
                raise QuoteDoesNotExistsException("Quote Not Found")

            quote.config_details = json.dumps(config_details)
            quote.save()

            response = self.fetch_and_update_names(config_details, tenant_id)

            return ResponseBuilder.success(
                status_code=status.HTTP_200_OK, data=response
            )
        except Exception as e:
            return ResponseBuilder.errors(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
