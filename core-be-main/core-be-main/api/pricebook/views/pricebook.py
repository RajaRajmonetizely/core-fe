import json
import uuid

from django.db.models import F
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from django.db import transaction

from api.account.models import Opportunity
from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature
from api.package.models import Package, PackageDetail
from api.plan.models import Plan, Tier
from api.pricebook.models import (
    PriceBook,
    PriceBookEntry,
    PriceBookRule,
    PriceBookEntryHistory,
    PriceBookHistory,
)
from api.pricebook.serializers.pricebook import (
    PriceBookEntrySerializer,
    PriceBookSerializer,
)
from api.pricing.formula_calculator import FormulaCalculator
from api.pricing.models import PricingModel, PricingModelDetails
from api.product.models import Product
from api.tenant.models import Tenant
from api.user.models import UserRole, UserRoleMapping
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class PriceBookViewSet(viewsets.ModelViewSet):
    authentication_classes = [CognitoAuthentication]

    queryset = PriceBook.objects.all()
    serializer_class = PriceBookSerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(is_deleted=False, tenant_id=tenant_id).order_by(
            F("created_on").desc()
        )

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "name": openapi.Schema(type=openapi.TYPE_STRING),
                "products": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "product_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "plan_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "package_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "pricing_model_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                        },
                    ),
                ),
            },
            required=["name"],
        ),
        responses={201: PriceBookSerializer},
    )
    def create(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        pricebook_data = {
            "name": request.data.get("name"),
            "products": request.data.get("products", []),
            "tenant_id": tenant_id,
        }

        serializer = self.get_serializer(data=pricebook_data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_create(serializer)
            pricebook_id = serializer.data["id"]
            pricebook_entries = []

            seen_product_ids = set()  # To keep track of seen product IDs

            try:
                for entry_data in pricebook_data["products"]:
                    if not all(
                        entry_data.get(field) not in (None, "")
                        for field in [
                            "product_id",
                            "plan_id",
                            "package_id",
                            "pricing_model_id",
                        ]
                    ):
                        raise ValueError("All fields in 'products' must have values")

                    product_id = entry_data.get("product_id")
                    plan_id = entry_data.get("plan_id")
                    package_id = entry_data.get("package_id")
                    pricing_model_id = entry_data.get("pricing_model_id")

                    if product_id in seen_product_ids:
                        raise ValueError(
                            "Duplicate Product(s) are not allowed for the same Pricebook."
                        )

                    seen_product_ids.add(product_id)
                    pricing_model = PricingModel.objects.get(id=pricing_model_id)
                    package = pricing_model.package_id
                    plan = package.plan_id
                    feature_repository = plan.feature_repository_id

                    if str(package.id) != package_id:
                        raise ValueError(
                            "Invalid relationship between pricing model and package."
                        )

                    if str(plan.id) != plan_id:
                        raise ValueError(
                            "Invalid relationship between package and plan."
                        )

                    if str(feature_repository.product_id.id) != product_id:
                        raise ValueError(
                            "Invalid relationship between plan and product."
                        )

                    entry_data["price_book_id"] = pricebook_id
                    entry_data["tenant_id"] = tenant_id

                    entry_serializer = PriceBookEntrySerializer(data=entry_data)
                    entry_serializer.is_valid(raise_exception=True)
                    entry_serializer.save()
                    pricebook_entries.append(entry_serializer.data)
            except Exception as e:
                transaction.set_rollback(True)
                return ResponseBuilder.errors(
                    message=str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            response_data = {
                "id": pricebook_id,
                "name": serializer.data["name"],
                "tenant_id": serializer.data["tenant_id"],
                "products": pricebook_entries,
            }

            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    pricebook_obj = PriceBook.objects.get(
                        id=pricebook_id, is_deleted=False
                    )
                    user_obj = get_user_obj_from_email(request.user[0])

                    # Create PriceBookHistory entry
                    pricebook_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_id": pricebook_obj,
                        "description": "Creating a new PriceBook",
                        "details": json.dumps(
                            {
                                "new_data": {
                                    "name": serializer.validated_data["name"],
                                }
                            }
                        ),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookHistory.objects.create(**pricebook_history_data)

                    # Create PriceBookEntryHistory entries
                    entry_objs = PriceBookEntry.objects.filter(
                        id__in=[entry["id"] for entry in pricebook_entries],
                        is_deleted=False,
                    )
                    entry_history_data_list = []

                    for entry_obj, entry_data in zip(entry_objs, pricebook_entries):
                        entry_history_data_list.append(
                            PriceBookEntryHistory(
                                admin_user_id=request.auth[1],
                                user_id=get_user_obj_from_email(request.user[0]),
                                pricebook_entry_id=entry_obj,
                                description="Creating a new PriceBook Entry",
                                details=json.dumps(
                                    {
                                        "new_data": {
                                            "product_id": str(entry_data["product_id"]),
                                            "plan_id": str(entry_data["plan_id"]),
                                            "package_id": str(entry_data["package_id"]),
                                            "pricing_model_id": str(
                                                entry_data["pricing_model_id"]
                                            ),
                                        }
                                    }
                                ),
                                tenant_id=tenant_obj,
                                created_by=user_obj,
                                updated_by=user_obj,
                            )
                        )

                    PriceBookEntryHistory.objects.bulk_create(entry_history_data_list)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entries: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        return ResponseBuilder.success(
            data=response_data,
            status_code=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "name": openapi.Schema(type=openapi.TYPE_STRING),
                "products": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "pricebook_entry_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "product_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "plan_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "package_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                            "pricing_model_id": openapi.Schema(
                                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
                            ),
                        },
                    ),
                ),
            },
            required=["products"],
        ),
        responses={200: PriceBookSerializer},
    )
    def update(self, request, *args, **kwargs):
        pricebook_data = request.data.copy()
        pricebook_entries_data = pricebook_data.pop("products", [])
        tenant_id = get_tenant_id_from_email(request.user[0])

        instance = self.get_object()

        if "name" in pricebook_data:
            # Serializer with 'name' field
            serializer = self.get_serializer(instance, data=pricebook_data)
        else:
            # Serializer without 'name' field
            serializer = self.get_serializer(
                instance, data=pricebook_data, partial=True
            )

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_update(serializer)
            pricebook_id = serializer.data["id"]
            pricebook_entries = []
            existing_entry_ids = []
            seen_product_ids = set()  # To keep track of seen product IDs
            entry_history_data_list = []

            try:
                for entry_data in pricebook_entries_data:
                    fields_not_allowed_null_or_empty = [
                        "product_id",
                        "plan_id",
                        "package_id",
                        "pricing_model_id",
                    ]
                    for field in fields_not_allowed_null_or_empty:
                        if entry_data.get(field) is None or entry_data.get(field) == "":
                            raise ValueError("'Pricebook' data cannot be empty.")
                    product_id = entry_data.get("product_id")
                    entry_id = entry_data.pop("pricebook_entry_id", None)

                    if product_id in seen_product_ids:
                        raise ValueError(
                            "Duplicate Product(s) are not allowed for the same Pricebook."
                        )

                    seen_product_ids.add(product_id)
                    pricing_model = PricingModel.objects.get(
                        id=entry_data["pricing_model_id"]
                    )
                    package = pricing_model.package_id
                    plan = package.plan_id
                    feature_repository = plan.feature_repository_id

                    if str(package.id) != entry_data["package_id"]:
                        raise ValueError(
                            "Invalid relationship between pricing model and package."
                        )

                    if str(plan.id) != entry_data["plan_id"]:
                        raise ValueError(
                            "Invalid relationship between package and plan."
                        )

                    if str(feature_repository.product_id.id) != product_id:
                        raise ValueError(
                            "Invalid relationship between plan and product."
                        )

                    if entry_id:
                        entry_instance = PriceBookEntry.objects.filter(
                            id=entry_id, price_book_id=pricebook_id, is_deleted=False
                        ).first()

                        if entry_instance:
                            previous_entry_data = PriceBookEntrySerializer(
                                entry_instance
                            ).data
                            # Update existing entry
                            entry_serializer = PriceBookEntrySerializer(
                                entry_instance, data=entry_data
                            )
                            entry_serializer.is_valid(raise_exception=True)
                            entry_serializer.save()

                            # Capture important data for updated entry
                            entry_history_data = {
                                "entry_instance": entry_instance,
                                "new_data": entry_serializer.data,
                                "previous_data": previous_entry_data,
                            }
                            entry_history_data_list.append(entry_history_data)

                        else:
                            # Entry not found, return error response
                            return ResponseBuilder.errors(
                                message="Pricebook Entry Id not found",
                                status_code=status.HTTP_400_BAD_REQUEST,
                            )
                    else:
                        # Create new entry
                        entry_data.update(
                            {"tenant_id": tenant_id, "price_book_id": pricebook_id}
                        )
                        entry_serializer = PriceBookEntrySerializer(data=entry_data)
                        entry_serializer.is_valid(raise_exception=True)
                        entry_serializer.save()

                        # Capture important data for new entry
                        entry_history_data = {
                            "entry_instance": entry_serializer.instance,
                            "new_data": entry_serializer.data,
                            "previous_data": None,
                        }
                        entry_history_data_list.append(entry_history_data)

                    pricebook_entries.append(entry_serializer.data)
                    existing_entry_ids.append(entry_serializer.instance.id)
            except Exception as e:
                transaction.set_rollback(True)
                return ResponseBuilder.errors(
                    message=str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            # Soft delete entries not present in the payload
            PriceBookEntry.objects.filter(
                price_book_id=pricebook_id, is_deleted=False
            ).exclude(Q(id__in=existing_entry_ids) | Q(is_deleted=True)).update(
                is_deleted=True
            )

            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    pricebook_obj = PriceBook.objects.get(
                        id=pricebook_id, is_deleted=False
                    )

                    # Create PriceBookHistory entry
                    pricebook_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_id": pricebook_obj,
                        "description": "Updating a PriceBook",
                        "details": json.dumps(
                            {
                                "new_data": pricebook_data,
                            }
                        ),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookHistory.objects.create(**pricebook_history_data)

                    # Create PriceBookEntryHistory entries
                    for entry_history_data in entry_history_data_list:
                        entry_instance = entry_history_data["entry_instance"]
                        new_data = entry_history_data["new_data"]
                        previous_data = entry_history_data["previous_data"]

                        # Convert UUID fields to strings in new_data dictionary
                        converted_new_data = CommonUtils.convert_uuids_to_strings(
                            new_data
                        )

                        # Convert UUID fields to strings in previous_data dictionary if not None
                        if previous_data:
                            converted_previous_data = (
                                CommonUtils.convert_uuids_to_strings(previous_data)
                            )
                        else:
                            converted_previous_data = None

                        # Create a new entry history for new entry
                        if previous_data is None:
                            PriceBookEntryHistory.objects.create(
                                admin_user_id=request.auth[1],
                                user_id=get_user_obj_from_email(request.user[0]),
                                pricebook_entry_id=entry_instance,
                                description="Creating a new PriceBook Entry",
                                details=json.dumps(
                                    {
                                        "new_data": converted_new_data,
                                    }
                                ),
                                tenant_id=tenant_obj,
                            )
                        else:
                            # Create a new entry history for updating entry
                            PriceBookEntryHistory.objects.create(
                                admin_user_id=request.auth[1],
                                user_id=get_user_obj_from_email(request.user[0]),
                                pricebook_entry_id=entry_instance,
                                description="Updating a PriceBook Entry",
                                details=json.dumps(
                                    {
                                        "new_data": converted_new_data,
                                        "previous_data": converted_previous_data,
                                    }
                                ),
                                tenant_id=tenant_obj,
                            )

            except Exception as e:
                transaction.set_rollback(True)
                return ResponseBuilder.errors(
                    message=str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        response_data = serializer.data
        response_data["products"] = pricebook_entries
        return ResponseBuilder.success(data=response_data)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "opportunity_id",
                openapi.IN_QUERY,
                description="ID of the Opportunity to filter Pricebook",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                required=False,
            )
        ],
        responses={200: PriceBookSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        logger.info("Getting all the price book")
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        dd_ie_role_obj = UserRole.objects.filter(
            name__in=["Deal Desk", "Implementation Analyst"], tenant_id=tenant_id, is_deleted=False
        )
        user_role_id = [item.id for item in dd_ie_role_obj]
        user_obj = get_user_obj_from_email(self.request.user[0])
        is_deal_desk_or_ie = False
        if user_role_id:
            user_role_map_obj = UserRoleMapping.objects.filter(
                user_id=user_obj.id,
                user_role_id__in=user_role_id,
                is_deleted=False,
            )
            if user_role_map_obj:
                is_deal_desk_or_ie = True
        user_id = user_obj.id
        queryset = self.filter_queryset(self.get_queryset())
        org_hierarchy_id = user_obj.org_hierarchy_id

        opportunity_id = request.query_params.get("opportunity_id")
        pricebook_ids = set()
        if opportunity_id:
            try:
                if is_deal_desk_or_ie:
                    opportunity_type = Opportunity.objects.get(
                        id=opportunity_id, is_deleted=False, tenant_id=tenant_id
                    ).type_id
                else:
                    opportunity_type = Opportunity.objects.get(
                        id=opportunity_id,
                        is_deleted=False,
                        tenant_id=tenant_id,
                        owner_id=user_id,
                    ).type_id
                pricebook_rule_details = PriceBookRule.objects.filter(
                    Q(
                        opportunity_type_id=opportunity_type.id,
                        tenant_id=tenant_id,
                        is_deleted=False,
                    )
                    & Q(Q(user_id=user_id) | Q(org_hierarchy_id=org_hierarchy_id))
                )

                pricebook_ids = [
                    pricebook.price_book_id.id for pricebook in pricebook_rule_details
                ]

            except Opportunity.DoesNotExist:
                queryset = queryset.none()

        if pricebook_ids:
            queryset = queryset.filter(id__in=list(pricebook_ids))

        pricebook_response = []
        # Retrieve additional information for each PriceBook entry
        for pricebook_data in queryset:
            pricebook_id = pricebook_data.id
            entries = PriceBookEntry.objects.filter(
                price_book_id=pricebook_id, is_deleted=False, tenant_id=tenant_id
            )

            # Creating a list of entry details with serialized entry_data
            products = [
                {
                    "product_name": entry.product_id.name,
                    "plan_name": entry.plan_id.name,
                    "package_name": entry.package_id.name,
                    "pricing_model_name": entry.pricing_model_id.name,
                    **PriceBookEntrySerializer(entry).data
                }
                for entry in entries
                if not entry.product_id.is_deleted and
                   not entry.plan_id.is_deleted and
                   not entry.package_id.is_deleted and
                   not entry.pricing_model_id.is_deleted
            ]

            data = {
                "id": pricebook_id,
                "name": pricebook_data.name,
                "tenant_id": tenant_id,
                "products": products
            }
            pricebook_response.append(data)

        return ResponseBuilder.success(
            data=pricebook_response, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(responses={200: PriceBookSerializer})
    def retrieve(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = serializer.data

        # Retrieve additional information for the PriceBook entry
        pricebook_id = response_data["id"]
        logger.info("Getting pricebook details for id %s", pricebook_id)
        entries = PriceBookEntry.objects.filter(price_book_id=pricebook_id, tenant_id=tenant_id, is_deleted=False)
        entry_data = PriceBookEntrySerializer(entries, many=True).data
        response_data["products"] = entry_data

        for entry in response_data["products"]:
            product_id = entry["product_id"]
            plan_id = entry["plan_id"]
            pricing_model_id = entry["pricing_model_id"]
            package_id = entry["package_id"]
            package_details = PackageDetail.objects.filter(
                package_id=package_id, is_deleted=False, tenant_id=tenant_id
            )
            tier_data = []  # List to store tier details for each package

            pricing_model_details = PricingModelDetails.objects.filter(
                pricing_model_id=pricing_model_id, is_deleted=False, tenant_id=tenant_id
            )

            for package in package_details:
                addon_features = []
                tier_details = Tier.objects.filter(
                    id=package.tier_id.id, tenant_id=tenant_id, is_deleted=False
                ).first()

                details = package.details

                if details:
                    try:
                        details = json.loads(details)
                    except json.JSONDecodeError:
                        details = {}

                for pricing_model_detail in pricing_model_details:
                    if pricing_model_detail.tier_id == package.tier_id:
                        current_pricing_model_detail = pricing_model_detail

                pricing_model_details_data = json.loads(
                    current_pricing_model_detail.details
                )

                pricing_model_detail_addons = pricing_model_details_data.get(
                    "addons", []
                )

                features = (
                    details.get("features", []) if isinstance(details, dict) else []
                )
                feature_groups = (
                    details.get("feature_groups", [])
                    if isinstance(details, dict)
                    else []
                )

                # Extract features from feature groups
                for group_feature in feature_groups:
                    features.extend(group_feature.get("features"))

                # Collect unique feature IDs for addon features
                feature_ids = set()
                logger.info("Addons details")
                for feature in features:
                    if feature.get("is_addon"):
                        feature_id = feature.get("feature_id")
                        feature_ids.add(feature_id)
                        for addon in pricing_model_detail_addons:
                            if addon["id"] == feature_id:
                                if not addon.get("is_custom_metric"):
                                    addon_features.append(
                                        {
                                            "id": feature_id,
                                            "name": None,
                                            "model": addon["details"]["model"],
                                            "sell_multiple": addon["details"].get(
                                                "sell_multiple", ""
                                            ),
                                        }
                                    )
                                else:
                                    addon_metric_columns = {
                                        item["key"]: item["name"]
                                        for item in addon.get("columns")
                                        if item.get("is_metric_column")
                                        or item.get("is_upto_column")
                                    }
                                    logger.info(addon_metric_columns)
                                    addon_list = []
                                    for item in addon["columns"]:
                                        if item.get("is_output_column"):
                                            if item.get("is_code_editor"):
                                                metric_key = (
                                                    FormulaCalculator.get_lookup(
                                                        item.get("advance_formula", "")
                                                    )
                                                )
                                            else:
                                                metric_key = (
                                                    FormulaCalculator.get_lookup(
                                                        item.get("formula", "")
                                                    )
                                                )
                                            addon_obj = {
                                                "output_column": {
                                                    "name": item["name"],
                                                    "key": item["key"],
                                                },
                                                "metric_column": {
                                                    "name": addon_metric_columns.get(metric_key),
                                                    "key": metric_key,
                                                },
                                            }
                                            addon_list.append(addon_obj)
                                    if addon_list:
                                        addon_features.append(
                                            {
                                                "id": feature_id,
                                                "name": None,
                                                "model": "Custom",
                                                "config": addon_list,
                                            }
                                        )

                # Fetch feature names for the collected feature IDs
                feature_names = Feature.objects.filter(
                    id__in=feature_ids, is_deleted=False
                ).values("id", "name")
                feature_names_mapping = {
                    str(feature["id"]): feature["name"] for feature in feature_names
                }

                # Update the name of addon features

                addon_details = pricing_model_details_data.get("addons", [])

                for addon_feature in addon_features:
                    for addon_detail in addon_details:
                        if addon_detail["id"] == feature_names_mapping.get(
                            addon_feature["id"]
                        ):
                            addon_feature["model"] = addon_detail["model"]

                    addon_feature["name"] = feature_names_mapping.get(
                        addon_feature["id"]
                    )

                if tier_details:
                    data = {
                        "tier_id": tier_details.id,
                        "tier_name": tier_details.name,
                        "addons": addon_features,
                    }
                    tier_data.append(data)

            # Get the names from the related tables
            entry["product_name"] = Product.objects.get(
                id=product_id, tenant_id=tenant_id, is_deleted=False
            ).name
            entry["plan_name"] = Plan.objects.get(
                id=plan_id, tenant_id=tenant_id, is_deleted=False
            ).name
            entry["package_name"] = Package.objects.get(
                id=package_id, tenant_id=tenant_id, is_deleted=False
            ).name
            entry["pricing_model_name"] = PricingModel.objects.get(
                id=pricing_model_id, tenant_id=tenant_id, is_deleted=False
            ).name
            entry["tier_details"] = tier_data

        return ResponseBuilder.success(data=response_data)

    def destroy(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        PriceBookRule.objects.filter(
            price_book_id=instance.id, is_deleted=False, tenant_id=tenant_id).update(is_deleted=True)
        instance.is_deleted = True
        instance.save()

        try:
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                # Create PriceBookHistory entry
                pricebook_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "pricebook_id": instance,
                    "description": "Deleting a PriceBook",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                PriceBookHistory.objects.create(**pricebook_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(status_code=status.HTTP_200_OK)
