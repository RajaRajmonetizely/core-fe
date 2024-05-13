import json
import uuid

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature
from api.package.models import Package, PackageDetail
from api.plan.models import Tier
from api.pricing.formula_calculator import FormulaCalculator
from api.pricing.models import (
    PricingMetric,
    PricingMetricMapping,
    PricingModel,
    PricingModelDetails,
    PricingStructure,
    PricingModelHistory,
)
from api.pricing.serializers.pricing_model import (
    PricingCalculatorSerializer,
    PricingCurveSerializer,
    PricingModelCreateSerializer,
    PricingModelSerializer,
)
from api.pricing.serializers.pricing_model_details import (
    AddonMetricSerializer,
    PricingModelDetailsSerilaizer,
    PricingModelUpdateSerializer,
    QuoteQuantitySerializer,
)
from api.tenant.models import Tenant
from api.user.utils import (
    get_tenant_id_from_email,
    get_user_obj_from_email,
    generate_unique_common_difference_numbers,
)
from api.utils.custom_exception_handler import (
    PackageDoesNotExistsException,
    PricingModelDoesNotExistsException,
    TierDoesNotExistsException,
    PricingModelDetailsDoesNotExistsException,
    CustomAddonExistsException,
)
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class PricingModelView(APIView):
    serializer_class = PricingModelSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "package_id",
                openapi.IN_QUERY,
                description="Get Pricing model details based on the package i",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=True,
            ),
        ]
    )
    def get(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        package_id = request.query_params.get("package_id")
        pricing_models = PricingModel.objects.filter(
            is_deleted=False, package_id=package_id, tenant_id=tenant_id
        )

        response = []
        for model in pricing_models:
            details = {}
            details.update({"id": model.id, "name": model.name})
            pricing_model_details = PricingModelDetails.objects.filter(
                pricing_model_id=model.id, tenant_id=tenant_id, is_deleted=False
            ).order_by("tier_id__created_on")
            tier_wise_details = []
            for item in pricing_model_details:
                tier_info = Tier.objects.filter(
                    id=item.tier_id.id, tenant_id=tenant_id, is_deleted=False
                ).first()
                if tier_info:
                    tier_wise_details.append(
                        {
                            "tier_id": tier_info.id,
                            "tier_name": tier_info.name,
                            "pricing_model_detail_id": item.id,
                            "details": PricingModelView.filter_deleted_features(
                                json.loads(item.details)
                            ),
                        }
                    )
            details.update({"details": tier_wise_details})
            response.append(details)

        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    def filter_deleted_features(data):
        if "addons" in data:
            addons = data["addons"]
            addon_ids = set(addon["id"] for addon in addons)

            non_deleted_addon_ids = Feature.objects.filter(
                id__in=addon_ids, is_deleted=False
            ).values_list("id", flat=True)
            non_deleted_addon_uuids = [
                uuid.UUID(str(id)) for id in non_deleted_addon_ids
            ]

            filtered_addons = [
                addon
                for addon in addons
                if uuid.UUID(str(addon["id"])) in non_deleted_addon_uuids
            ]
            data["addons"] = filtered_addons

        return data

    @swagger_auto_schema(
        request_body=PricingModelCreateSerializer,
        manual_parameters=[
            openapi.Parameter(
                "source",
                openapi.IN_QUERY,
                description="Clone of pricing model based on the given id",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ],
    )
    def post(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
        existing_pricing_model_id = request.query_params.get("source")
        if existing_pricing_model_id:
            existing_pricing_model = PricingModel.objects.filter(
                id=existing_pricing_model_id, tenant_id=tenant_id, is_deleted=False
            ).first()
            if not existing_pricing_model:
                raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")

            if existing_pricing_model.name == request.data["name"]:
                return ResponseBuilder.errors(
                    message=f"A Pricing Model with name '{existing_pricing_model.name}' already exists for this Package.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            package = Package.objects.filter(
                id=existing_pricing_model.package_id.id,
                tenant_id=tenant_id,
                is_deleted=False,
            )
            if not package:
                raise PackageDoesNotExistsException("Package does not exists")

            cloned_pricing_model = PricingModel.objects.create(
                name=request.data["name"],
                package_id=package[0],
                pricing_structure_id=existing_pricing_model.pricing_structure_id,
                tenant_id=tenant_obj,
            )

            existing_pricing_metric_map_obj = PricingMetricMapping.objects.filter(
                pricing_model_id=existing_pricing_model_id, is_deleted=False
            )

            for metric_map_obj in existing_pricing_metric_map_obj:
                pricing_metric = PricingMetric.objects.get(
                    id=metric_map_obj.pricing_metrics_id.id,
                    tenant_id=tenant_id,
                    is_deleted=False,
                )
                PricingMetricMapping.objects.create(
                    pricing_metrics_id=pricing_metric,
                    pricing_model_id=cloned_pricing_model,
                )

            pricing_model_details = PricingModelDetails.objects.filter(
                pricing_model_id=existing_pricing_model_id, tenant_id=tenant_id
            )
            for detail in pricing_model_details:
                PricingModelDetails.objects.create(
                    pricing_model_id=cloned_pricing_model,
                    tier_id=detail.tier_id,
                    details=detail.details,
                    tenant_id=tenant_obj,
                )
            # check for user impersonation
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                PricingModelHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description="Pricing Model Cloned",
                    tenant_id=tenant_obj,
                    pricing_model_id=cloned_pricing_model,
                    details=json.dumps(
                        {"existing_pricing_model_id": existing_pricing_model_id}
                    ),
                )
            return ResponseBuilder.success(
                data={"id": cloned_pricing_model.id, "name": cloned_pricing_model.name},
                status_code=status.HTTP_201_CREATED,
            )
        else:
            package = Package.objects.filter(
                id=request.data.get("package_id"), tenant_id=tenant_id, is_deleted=False
            )
            if not package:
                raise PackageDoesNotExistsException("Package does not exists")

            # Check if a pricing model with the same name already exists for the package
            existing_pricing_model_name = request.data.get("name")
            existing_pricing_model_for_package = PricingModel.objects.filter(
                name=existing_pricing_model_name,
                package_id=package[0],
                tenant_id=tenant_obj,
                is_deleted=False,
            )
            if existing_pricing_model_for_package:
                return ResponseBuilder.errors(
                    message=f"A Pricing Model with name '{existing_pricing_model_name}' already exists for this Package.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            pricing_model_obj = PricingModel.objects.create(
                name=request.data["name"], package_id=package[0], tenant_id=tenant_obj
            )

            package_details = PackageDetail.objects.filter(
                package_id=request.data["package_id"], tenant_id=tenant_id
            )
            if not package_details:
                raise TierDoesNotExistsException("No tiers found for the package")

            for item in package_details:
                PricingModelDetails.objects.create(
                    pricing_model_id=pricing_model_obj,
                    tier_id=item.tier_id,
                    details=json.dumps({}),
                    tenant_id=tenant_obj,
                )
            # check for user impersonation
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                PricingModelHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description="Pricing Model Created",
                    tenant_id=tenant_obj,
                    pricing_model_id=pricing_model_obj,
                    details=json.dumps({}),
                )
            return ResponseBuilder.success(
                data={"id": pricing_model_obj.id, "name": pricing_model_obj.name},
                status_code=status.HTTP_201_CREATED,
            )


class PricingModelDetailView(APIView):
    serializer_class = PricingModelSerializer
    authentication_classes = [CognitoAuthentication]

    def get(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        pricing_model = PricingModel.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False
        )
        if not pricing_model:
            raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")

        response = {}
        if pricing_model:
            response.update(
                {
                    "id": pricing_model[0].id,
                    "name": pricing_model[0].name,
                    "package_id": pricing_model[0].package_id.id,
                }
            )
            metric_details = PricingMetricMapping.objects.filter(
                pricing_model_id=pricing_model[0].id, is_deleted=False
            )
            response.update(
                {
                    "metric_details": [
                        {
                            "id": metric.pricing_metrics_id.id,
                            "name": metric.pricing_metrics_id.name,
                        }
                        for metric in metric_details
                    ]
                }
            )
            pricing_structure = PricingStructure.objects.filter(
                id=pricing_model[0].pricing_structure_id, is_deleted=False
            )
            if pricing_structure:
                response.update(
                    {
                        "pricing_structure_id": pricing_structure[0].id,
                        "pricing_structure_name": pricing_structure[0].name,
                    }
                )
            pricing_model_details = PricingModelDetails.objects.filter(
                pricing_model_id=pricing_model[0], tenant_id=tenant_id
            ).order_by("tier_id__created_on")

            tier_wise_details = []
            for item in pricing_model_details:
                tier_info = Tier.objects.filter(
                    id=item.tier_id.id, tenant_id=tenant_id, is_deleted=False
                ).first()
                if tier_info:
                    details = json.loads(item.details)
                    addons = details.get("addons", [])
                    for addon in addons:
                        feature_obj = Feature.objects.filter(
                            id=addon.get("id"), tenant_id=tenant_id, is_deleted=False
                        ).first()
                        if not feature_obj:
                            _ = addons.pop(addons.index(addon))
                            continue
                        elif not feature_obj.feature_group_id:
                            _ = addons.pop(addons.index(addon))
                            continue

                        tier_id, package_id = (
                            item.tier_id.id,
                            pricing_model[0].package_id.id,
                        )
                        package_detail_obj = PackageDetail.objects.filter(
                            package_id=package_id,
                            tier_id=tier_id,
                            is_deleted=False,
                            tenant_id=tenant_id,
                        ).first()
                        if package_detail_obj:
                            feature_groups = json.loads(package_detail_obj.details).get(
                                "feature_groups", []
                            )
                            found = False
                            for feature_group in feature_groups:
                                for feature in feature_group.get("features", []):
                                    if feature.get("feature_id") == addon.get(
                                            "id"
                                    ) and addon.get("is_custom_metric"):
                                        if not feature.get("is_addon"):
                                            _ = addons.pop(addons.index(addon))
                                            item.details = json.dumps(details)
                                            item.save()
                                        found = True
                                    elif feature.get("feature_id") == addon.get("id"):
                                        if not feature.get("is_addon"):
                                            found = False
                                        else:
                                            found = True
                            if not found:
                                _ = addons.pop(addons.index(addon))
                                item.details = json.dumps(details)
                                item.save()

                        pricing_metric_details = []
                        for metric in addon.get("metric_details", []):
                            pricing_metric = PricingMetric.objects.get(
                                id=metric, is_deleted=False
                            )
                            pricing_metric_details.append(
                                {"id": pricing_metric.id, "name": pricing_metric.name}
                            )

                        addon["metric_details"] = pricing_metric_details
                        if addon.get("pricing_structure_id"):
                            pricing_structure = PricingStructure.objects.filter(
                                id=addon.get("pricing_structure_id"), is_deleted=False
                            )
                            if pricing_structure:
                                addon["pricing_structure_id"] = pricing_structure[0].id
                                addon["pricing_structure_name"] = pricing_structure[
                                    0
                                ].name

                    tier_wise_details.append(
                        {
                            "pricing_model_detail_id": item.id,
                            "tier_id": tier_info.id,
                            "tier_name": tier_info.name,
                            "details": details,
                        }
                    )
            response.update({"details": tier_wise_details})
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=PricingModelUpdateSerializer)
    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        request_data = request.data
        pricing_model = PricingModel.objects.get(
            id=id, tenant_id=tenant_id, is_deleted=False
        )
        if not pricing_model:
            raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")

        metric_details = request_data.get("metric_details")

        PricingMetricMapping.objects.filter(
            is_deleted=False, pricing_model_id=id
        ).delete()
        for item in metric_details:
            pricing_metric = PricingMetric.objects.get(
                id=item, tenant_id=tenant_id, is_deleted=False
            )
            PricingMetricMapping.objects.create(
                pricing_metrics_id=pricing_metric, pricing_model_id=pricing_model
            )

        pricing_structure_id = request_data.get("pricing_structure_id")
        details = request_data.get("details")
        for pm in details:
            addons = pm.get("addons")
            custom_addon_metric_names = [
                addon["metric_name"]
                for addon in addons
                if addon.get("is_custom_metric")
            ]
            if len(set(custom_addon_metric_names)) != len(custom_addon_metric_names):
                raise CustomAddonExistsException(
                    "Custom Addon with this name already exists"
                )
        old_data = []
        new_updated_data = []
        for detail in details:
            new_data, previous_data = {}, {}
            pricing_model_detail_id = detail.pop("pricing_model_detail_id")
            new_data["pricing_model_detail_id"] = pricing_model_detail_id
            previous_data["pricing_model_detail_id"] = pricing_model_detail_id
            pricing_model_detail = PricingModelDetails.objects.get(
                id=pricing_model_detail_id, tenant_id=tenant_id, is_deleted=False
            )
            previous_data["details"] = pricing_model_detail.details
            previous_data["pricing_structure_id"] = str(
                pricing_model.pricing_structure_id
            )
            new_data["details"] = pricing_model_detail.details
            new_data["pricing_structure_id"] = str(pricing_structure_id)
            old_data.append(previous_data)
            new_updated_data.append(new_data)

            pricing_model_detail.details = json.dumps(detail)
            pricing_model_detail.save()
            pricing_model.pricing_structure_id = pricing_structure_id
            pricing_model.save()

        # check for user impersonation
        if request.auth and request.auth[0]:
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            PricingModelHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Pricing Model Updated",
                tenant_id=tenant_obj,
                pricing_model_id=pricing_model,
                details=json.dumps(
                    {"new_data": new_updated_data, "previous_data": old_data}
                ),
            )

        return ResponseBuilder.success(
            data="Pricing Model updated successfully", status_code=status.HTTP_200_OK
        )


class AddonMetricView(APIView):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=AddonMetricSerializer)
    def post(self, request, id):
        payload = request.data
        pricing_models_detail = PricingModelDetails.objects.filter(
            pricing_model_id=id, tier_id=payload.get("tier_id"), is_deleted=False
        )
        if not pricing_models_detail:
            raise PricingModelDetailsDoesNotExistsException(
                "Pricing Model Detail Not Found"
            )

        details = json.loads(pricing_models_detail[0].details)
        data = {
            "id": payload.get("addon_id"),
            "metric_name": payload.get("name"),
            "is_custom_metric": True,
            "columns": [],
            "values": [],
        }
        if details.get("addons"):
            details.get("addons").append(data)
        else:
            details["addons"] = [data]
        pricing_models_detail[0].details = json.dumps(details)
        pricing_models_detail[0].save()

        return ResponseBuilder.success(
            data="Addon metric added successfully", status_code=status.HTTP_200_OK
        )


class PricingMetricAddons(APIView):
    authentication_classes = [CognitoAuthentication]

    def get(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        pricing_model = PricingModel.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False
        )
        if not pricing_model:
            raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")

        pricing_model_details = PricingModelDetails.objects.filter(
            pricing_model_id=pricing_model[0].id, tenant_id=tenant_id, is_deleted=False
        )
        response = {"id": id, "name": pricing_model.name, "addons": []}
        for item in pricing_model_details:
            details = json.loads(item.details)
            addons = details.get("addons", [])
            data = {"tier_name": item.tier_id.name, "tier_addons": []}
            for addon in addons:
                feature_object = Feature.objects.get(
                    id=addon.get("id"), is_deleted=False, tenant_id=tenant_id
                )
                data["tier_addons"].append(
                    {"id": feature_object.id, "name": feature_object.name}
                )
            response["addons"].append(data)

        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)


class PricingCalculator(APIView):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=PricingCalculatorSerializer)
    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        pricing_model = PricingModel.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False
        )
        if not pricing_model:
            raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")

        form_data = request.data
        final_response = []
        for item in form_data:
            pricing_model_details = PricingModelDetails.objects.get(
                pricing_model_id=pricing_model[0].id,
                tier_id=item["tier_id"],
                tenant_id=tenant_id,
            )
            response = {
                "tier_id": item["tier_id"],
                "tier_name": pricing_model_details.tier_id.name,
                "core_output": 0,
                "addon_output": [],
            }
            pricing_data = json.loads(pricing_model_details.details)
            core_details = pricing_data["core"]
            if core_details:
                core_output = FormulaCalculator.calculate(
                    data=core_details["values"],
                    columns=core_details["columns"],
                    quantity_dict=item["quantity"],
                )
                response["core_output"] = core_output["final_output"]
            if item.get("addons"):
                addon_details = pricing_data["addons"]
                addons_config = {
                    addon["addon_id"]: addon["addon_units"] for addon in item["addons"]
                }
                addons_output_keys_config = {
                    addon["addon_id"]: addon.get("addon_output_keys")
                    for addon in item["addons"]
                }
                for addon in addon_details:
                    if addon["id"] not in addons_config:
                        continue
                    feature_object = Feature.objects.get(
                        id=addon.get("id"), is_deleted=False, tenant_id=tenant_id
                    )
                    if addon["is_custom_metric"]:
                        addon_response = {}
                        addon_output_key = addons_output_keys_config[addon["id"]]
                        addon_columns = addon.get("columns", [])
                        addon_values = addon.get("values", [])
                        quantity_dict = addons_config[addon["id"]]
                        for metric_key, quantity in quantity_dict.items():
                            result = FormulaCalculator.calculate(
                                columns=addon_columns,
                                quantity_dict={metric_key: quantity},
                                data=addon_values,
                            )
                            price = result[addon_output_key[metric_key]]
                            addon_response[metric_key] = price
                        response["addon_output"].append(
                            {
                                "id": feature_object.id,
                                "name": feature_object.name,
                                "value": addon_response,
                            }
                        )
                    else:
                        addon_value = addon["details"]
                        no_of_addons = addons_config[addon["id"]]
                        if addon_value["model"] == "Fixed Price":
                            amount = int(addon_value["fee"].replace("$", ""))
                            response["addon_output"].append(
                                {
                                    "id": feature_object.id,
                                    "name": feature_object.name,
                                    "value": amount * no_of_addons,
                                }
                            )
                        else:
                            core_proportion = (
                                                      int(addon_value["fee"].replace("%", ""))
                                                      * response["core_output"]
                                              ) // 100
                            if (
                                    int(addon_value["min"])
                                    <= core_proportion
                                    <= int(addon_value["max"])
                            ):
                                amount = core_proportion
                            else:
                                amount = (
                                    int(addon_value["min"])
                                    if core_proportion < int(addon_value["min"])
                                    else int(addon_value["max"])
                                )
                            response["addon_output"].append(
                                {
                                    "id": feature_object.id,
                                    "name": feature_object.name,
                                    "value": amount * no_of_addons,
                                }
                            )
            total = response["core_output"]
            for output in response["addon_output"]:
                if isinstance(output["value"], dict):
                    for _, addon_val in output["value"].items():
                        total += addon_val
                else:
                    total += output["value"]
            response["total"] = total
            final_response.append(response)
        return ResponseBuilder.success(
            data=final_response, status_code=status.HTTP_200_OK
        )


class PricingCurveConfig(APIView):
    authentication_classes = [CognitoAuthentication]

    def get(self, request, id):
        logger.info("Getting the config for pricing curve")
        pricing_model_details = PricingModelDetails.objects.filter(
            pricing_model_id=id, is_deleted=False, tier_id__is_deleted=False
        )
        if not pricing_model_details:
            raise PricingModelDetailsDoesNotExistsException(
                "Pricing Model Detail Not Found"
            )
        curve_config = []
        for pricing_model in pricing_model_details:
            tier_id = pricing_model.tier_id.id
            pricing_details = json.loads(pricing_model.details)
            core_columns = pricing_details.get("core", {}).get("columns", {})
            addons = pricing_details.get("addons", {})
            metric_columns = {
                item["key"]: item["name"]
                for item in core_columns
                if item.get("is_metric_column") or item.get("is_upto_column")
            }
            core_response = []
            addon_response = []
            logger.info(metric_columns)
            logger.info(core_columns)
            for item in core_columns:
                if item.get("is_output_column"):
                    if item.get("is_code_editor"):
                        metric_key = FormulaCalculator.get_metric_key(
                            item.get("advance_formula")
                        )
                    else:
                        metric_key = FormulaCalculator.get_lookup(item.get("formula"))
                    obj = {
                        "output_column": {"name": item["name"], "key": item["key"]},
                        "metric_column": {
                            "name": metric_columns.get(metric_key, ""),
                            "key": metric_key,
                        },
                    }
                    core_response.append(obj)
            for addon in addons:
                if addon.get("is_custom_metric"):
                    addon_metric_columns = {
                        item["key"]: item["name"]
                        for item in addon.get("columns")
                        if item.get("is_metric_column") or item.get("is_upto_column")
                    }
                    addon_list = []
                    for item in addon["columns"]:
                        if item.get("is_output_column"):
                            if item.get("is_code_editor"):
                                metric_key = FormulaCalculator.get_metric_key(
                                    item.get("advance_formula", "")
                                )
                            else:
                                metric_key = FormulaCalculator.get_lookup(
                                    item.get("formula", "")
                                )
                            addon_obj = {
                                "output_column": {
                                    "name": item["name"],
                                    "key": item["key"],
                                },
                                "metric_column": {
                                    "name": addon_metric_columns.get(metric_key, ""),
                                    "key": metric_key,
                                },
                            }
                            addon_list.append(addon_obj)
                    if addon_list:
                        addon_response.append({addon["id"]: addon_list})
            curve_config.append(
                {str(tier_id): {"core": core_response, "addon": addon_response}}
            )
        return ResponseBuilder.success(data=curve_config)


class PricingCurve(APIView):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=PricingCurveSerializer(many=True))
    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        pricing_model = PricingModel.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False
        )
        if not pricing_model:
            raise PricingModelDoesNotExistsException("Pricing Model Does Not Exist")
        pricing_model_details = PricingModelDetails.objects.filter(
            pricing_model_id=pricing_model[0].id, tenant_id=tenant_id
        )
        form_data = request.data or []
        tier_ids = [data.get("tier_id") for data in form_data]
        if tier_ids:
            logger.info("Getting curve for selected tiers")
            pricing_model_details = pricing_model_details.filter(tier_id__in=tier_ids)

        input_addon_data = {}
        for data in form_data:
            for addon in data.get("addons", []):
                key = data.get("tier_id") + ":" + addon.get("addon_id")
                input_addon_data[key] = addon.get("addon_units")

        metric_range_data = {}
        tier_wise_range = {}
        for item in pricing_model_details:
            min_no, max_no = -1, -1
            details = json.loads(item.details)
            core_model = details.get("core", [])
            if core_model:
                core_model_columns = core_model.get("columns", [])
                metric_columns = [
                    item.get("key")
                    for item in core_model_columns
                    if item.get("is_metric_column") or item.get("is_upto_column")
                ]
                core_model_values = core_model.get("values", [])
                if core_model_values:
                    for column in metric_columns:
                        min_range, max_range = [], []
                        min_metric_range = core_model_values[0]
                        max_metric_range = core_model_values[-1]
                        if column in min_metric_range and column in max_metric_range:
                            if column in metric_range_data:
                                v = metric_range_data[column]
                                if isinstance(min_metric_range.get(column), dict):
                                    min_no = min_metric_range.get(column).get("low")
                                    max_no = max_metric_range.get(column).get("high")
                                    v.get("min_range").append(min_no)
                                    v.get("max_range").append(max_no)
                                else:
                                    min_no = 0
                                    max_no = max_metric_range.get(column)
                                    v.get("min_range").append(min_no)
                                    v.get("max_range").append(max_no)
                            else:
                                if isinstance(min_metric_range.get(column), dict):
                                    min_no = min_metric_range.get(column).get("low")
                                    max_no = max_metric_range.get(column).get("high")
                                    min_range.append(min_no)
                                    max_range.append(max_no)
                                else:
                                    min_no = 0
                                    max_no = max_metric_range.get(column)
                                    min_range.append(min_no)
                                    max_range.append(max_no)
                                metric_range_data[column] = {
                                    "min_range": min_range,
                                    "max_range": max_range,
                                }
            tier_wise_range[item.tier_id.id] = [min_no, max_no]

        if not metric_range_data:
            return ResponseBuilder.success(data={}, status_code=status.HTTP_200_OK)
        random_nos = {}
        for key, value in metric_range_data.items():
            random_nos[key] = generate_unique_common_difference_numbers(
                min(value.get("min_range")), max(value.get("max_range"))
            )

        response = []

        for item in pricing_model_details:
            details = json.loads(item.details)
            core_sample_output = {}
            core_output = {}
            tier_range = tier_wise_range.get(item.tier_id.id, [])

            core_model = details.get("core", [])
            consider_addon_calc = {
                attr["tier_id"]: attr["addons"] for attr in form_data
            }
            addon_core_model_detail = details.get("addons", [])
            if core_model:
                core_model_columns = core_model.get("columns", [])
                core_model_values = core_model.get("values", [])

                if core_model_values and not core_model_values == [{}]:
                    for sample, sample_value in random_nos.items():
                        sample_output = {}
                        for no in sample_value:
                            if not tier_range[0] <= no <= tier_range[-1]:
                                continue
                            quantity_dict = {sample: no}
                            amount = FormulaCalculator.calculate(
                                core_model_columns,
                                core_model_values,
                                quantity_dict,
                                is_curve=True,
                            )
                            sample_output.update(
                                {no: amount.get("final_output") if amount else 0}
                            )

                        for addon in addon_core_model_detail:
                            if not consider_addon_calc.get(str(item.tier_id.id), ""):
                                continue
                            addon_qty = input_addon_data.get(
                                str(item.tier_id.id) + ":" + addon.get("id")
                            )
                            if not addon.get("is_custom_metric"):
                                addon_details = addon.get("details")
                                for key, value in sample_output.items():
                                    if addon_details["model"] == "Fixed Price":
                                        addon_amount = int(
                                            addon_details["fee"].replace("$", "")
                                        )
                                        addon_amount = (
                                            addon_amount if addon_amount else 0
                                        )
                                        if addon_qty:
                                            addon_amount *= int(addon_qty)
                                        if value:
                                            sample_output[key] = value + addon_amount
                                    else:
                                        core_proportion = (
                                                                  int(addon_details["fee"].replace("%", ""))
                                                                  * value
                                                          ) // 100
                                        if (
                                                int(addon_details["min"])
                                                <= core_proportion
                                                <= int(addon_details["max"])
                                        ):
                                            amount = core_proportion
                                        else:
                                            amount = (
                                                int(addon_details["min"])
                                                if core_proportion
                                                   < int(addon_details["min"])
                                                else int(addon_details["max"])
                                            )
                                        if addon_qty:
                                            amount *= int(addon_qty)
                                        if value:
                                            sample_output[key] = value + amount
                            elif form_data:
                                if addon_qty:
                                    amount = FormulaCalculator.calculate(
                                        columns=addon["columns"],
                                        data=addon["values"],
                                        quantity_dict=addon_qty,
                                        is_curve=True,
                                    )
                                    for key, value in sample_output.items():
                                        sample_output[key] = (
                                                value + amount["final_output"]
                                        )
                        core_sample_output[sample] = sample_output
            core_output.update({item.tier_id.name: core_sample_output})
            response.append(core_output)

        # Response reformat
        dict_data = {}
        for item in response:
            for k, v in item.items():
                for x, y in v.items():
                    if x in dict_data:
                        dict_data[x].update({k: y})
                    else:
                        dict_data[x] = {k: y}
        result = {}
        for key, val in dict_data.items():
            out = []
            res = {}
            for k, v in val.items():
                for x, y in v.items():
                    if x in res:
                        value = out[res[x]]
                        value[k] = y
                    else:
                        z = {"name": x, k: y}
                        out.append(z)
                        res[x] = out.index(z)
            # Sort the list of dictionaries based on the 'name' key
            sorted_data = sorted(out, key=lambda x: x["name"])
            result[key] = sorted_data

        return ResponseBuilder.success(data=result, status_code=status.HTTP_200_OK)


class DrivingFieldsDetailsView(APIView):
    serializer_class = PricingModelDetailsSerilaizer
    authentication_classes = [CognitoAuthentication]

    def get(self, request, pricing_model_id, tier_id):
        logger.info("Getting the driving field config")
        pricing_model_details = PricingModelDetails.objects.filter(
            pricing_model_id=pricing_model_id, tier_id=tier_id, is_deleted=False
        )
        if not pricing_model_details:
            raise PricingModelDetailsDoesNotExistsException(
                "Pricing Model Detail Not Found"
            )

        pricing_model_details_data = PricingModelDetailsSerilaizer(
            pricing_model_details[0]
        ).data
        core_columns = (
            pricing_model_details_data.get("details", {})
            .get("core", {})
            .get("columns", {})
        )
        addons = pricing_model_details_data.get("details", {}).get("addons", {})
        metric_columns = {
            item["key"]: item["name"]
            for item in core_columns
            if item.get("is_metric_column") or item.get("is_upto_column")
        }
        core_unit_columns = {
            item["key"]: item["name"]
            for item in core_columns
            if item.get("is_unit_column")
        }
        core_output_columns = []
        addon_response = []
        for item in core_columns:
            if item.get("is_output_column"):
                if item.get("is_code_editor"):
                    metric_key = FormulaCalculator.get_metric_key(
                        item.get("advance_formula", "")
                    )
                    formula = item.get("advance_formula")
                else:
                    metric_key = FormulaCalculator.get_lookup(item.get("formula", ""))
                    formula = item.get("formula")
                unit_column_list = []
                for unit_col in core_unit_columns:
                    if unit_col in formula:
                        unit_column_list.append(
                            {"key": unit_col, "name": core_unit_columns[unit_col]}
                        )
                obj = {
                    "output_column": {"name": item["name"], "key": item["key"]},
                    "metric_column": {
                        "name": metric_columns.get(metric_key, ""),
                        "key": metric_key,
                    },
                    "unit_columns": unit_column_list,
                }
                core_output_columns.append(obj)
        for addon in addons:
            if addon.get("is_custom_metric"):
                addon_metric_columns = {
                    item["key"]: item["name"]
                    for item in addon.get("columns")
                    if item.get("is_metric_column") or item.get("is_upto_column")
                }
                addon_unit_columns = {
                    item["key"]: item["name"]
                    for item in addon.get("columns")
                    if item.get("is_unit_column")
                }
                addon_list = []
                for item in addon["columns"]:
                    if item.get("is_output_column"):
                        if item.get("is_code_editor"):
                            metric_key = FormulaCalculator.get_metric_key(
                                item.get("advance_formula", "")
                            )
                            formula = item.get("advance_formula")
                        else:
                            metric_key = FormulaCalculator.get_lookup(
                                item.get("formula", "")
                            )
                            formula = item.get("formula")
                        addon_unit_column_list = []
                        for unit_col in addon_unit_columns:
                            if unit_col in formula:
                                addon_unit_column_list.append(
                                    {
                                        "key": unit_col,
                                        "name": addon_unit_columns[unit_col],
                                    }
                                )
                        addon_obj = {
                            "output_column": {"name": item["name"], "key": item["key"]},
                            "metric_column": {
                                "name": addon_metric_columns.get(metric_key, ""),
                                "key": metric_key,
                            },
                            "unit_columns": addon_unit_column_list,
                        }
                        addon_list.append(addon_obj)
                if addon_list:
                    addon_response.append({addon["id"]: addon_list})
        return ResponseBuilder.success(
            data={"core": core_output_columns, "addon": addon_response}
        )

    @swagger_auto_schema(request_body=QuoteQuantitySerializer)
    def put(self, request, pricing_model_id, tier_id):
        try:
            data = request.data
            quantity_dict = data.get("quantity_dict")
            discounted_list_unit_price_dict = data.get(
                "discounted_list_unit_price_dict"
            )
            discounted_total_price_dict = data.get("discounted_total_price_dict")
            addons = data.get("addons")
            core_output_key = data.get("output_keys")
            pricing_model_details = PricingModelDetails.objects.get(
                pricing_model_id=pricing_model_id, tier_id=tier_id
            )
            if not pricing_model_details:
                raise PricingModelDetailsDoesNotExistsException(
                    "Pricing Model Detail Not Found"
                )
            pricing_model_details = PricingModelDetailsSerilaizer(
                pricing_model_details
            ).data
            core_details = pricing_model_details["details"]["core"]
            response = {"core_total_output": 0, "addon_output": []}
            output_columns = {
                item["key"]: item.get("formula", "")
                for item in core_details["columns"]
                if item.get("is_output_column")
            }
            unit_columns = [
                item["key"]
                for item in core_details["columns"]
                if item.get("is_unit_column")
            ]
            for metric_key, quantity in quantity_dict.items():
                lookup_row = FormulaCalculator.get_row_from_range(
                    data=core_details["values"],
                    quantity=quantity,
                    metric_key=metric_key,
                )
                formula = output_columns[core_output_key[metric_key]]
                list_unit_price = {}
                for unit_col in unit_columns:
                    if unit_col in formula:
                        list_unit_price.update({unit_col: lookup_row.get(unit_col, "")})
                result = FormulaCalculator.calculate(
                    columns=core_details["columns"],
                    quantity_dict={metric_key: quantity},
                    data=core_details["values"],
                )
                list_total_price = result[core_output_key[metric_key]]
                discounted_total_price = list_total_price
                discount_percent = 0
                list_discounted_unit_price = {}
                if discounted_total_price_dict and discounted_total_price_dict.get(
                        metric_key
                ):
                    discounted_total_price = discounted_total_price_dict[metric_key]
                    discount_percent = (
                        ((list_total_price - discounted_total_price) / list_total_price)
                        * 100
                        if (list_total_price and discounted_total_price) > 0
                           and (list_total_price != discounted_total_price)
                        else 0
                    )
                    if quantity > 0:
                        list_discounted_unit_price = (
                            {unit_columns[0]: discounted_total_price / quantity}
                            if len(unit_columns) == 1
                            else {}
                        )
                if (
                        discounted_list_unit_price_dict
                        and discounted_list_unit_price_dict.get(metric_key)
                ):
                    discounted_units = discounted_list_unit_price_dict[metric_key]
                    result = FormulaCalculator.calculate(
                        columns=core_details["columns"],
                        quantity_dict={metric_key: quantity},
                        data=core_details["values"],
                        discounted_units=discounted_units,
                    )
                    list_discounted_unit_price = {
                        key: value for key, value in discounted_units.items()
                    }
                    discounted_total_price = result[core_output_key[metric_key]]
                    discount_percent = (
                        ((list_total_price - discounted_total_price) / list_total_price)
                        * 100
                        if (list_total_price and discounted_total_price) > 0
                           and (list_total_price != discounted_total_price)
                        else 0
                    )
                response[metric_key] = {
                    "list_unit_price": list_unit_price,
                    "discounted_unit_price": list_discounted_unit_price,
                    "discounted_total_price": discounted_total_price
                    if discounted_total_price
                    else list_total_price,
                    "list_total_price": list_total_price,
                    "discount": round(discount_percent, 3) if discount_percent else 0,
                }
            for metric_key in core_output_key:
                total = response[metric_key]
                response["core_total_output"] += total["discounted_total_price"]
            addon_details = pricing_model_details["details"]["addons"]
            addons_config = {addon["id"]: addon["units"] for addon in addons}
            addons_output_keys_config = {
                addon["id"]: addon.get("addon_output_keys") for addon in addons
            }
            addons_discounted_list_unit_price_config = {
                addon["id"]: addon.get("discounted_list_unit_price_dict")
                for addon in addons
            }
            addons_discounted_total_price_config = {
                addon["id"]: addon.get("discounted_total_price_dict")
                for addon in addons
            }
            for addon in addon_details:
                addon_line_item = {
                    "list_unit_price": {},
                    "discounted_unit_price": {},
                    "list_total_price": None,
                    "discount": None,
                    "discounted_total_price": None,
                }
                if addon["id"] not in addons_config:
                    continue
                if addon.get("is_custom_metric"):
                    addon_response = {}
                    addon_columns = addon.get("columns", [])
                    addon_values = addon.get("values", [])
                    input_payload = addons_config[addon["id"]]
                    discounted_list_unit_price_dict = (
                        addons_discounted_list_unit_price_config[addon["id"]]
                    )
                    discounted_total_price_dict = addons_discounted_total_price_config[
                        addon["id"]
                    ]
                    addon_output_key = addons_output_keys_config[addon["id"]]
                    addon_output_columns = {
                        item["key"]: item.get("formula", "")
                        for item in addon_columns
                        if item.get("is_output_column")
                    }
                    addon_unit_columns = [
                        item["key"]
                        for item in addon_columns
                        if item.get("is_unit_column")
                    ]
                    for metric_key, quantity in input_payload.items():
                        lookup_row = FormulaCalculator.get_row_from_range(
                            data=addon_values,
                            quantity=quantity,
                            metric_key=metric_key,
                        )
                        formula = addon_output_columns[addon_output_key[metric_key]]
                        list_unit_price = {}
                        for unit_col in addon_unit_columns:
                            if unit_col in formula:
                                list_unit_price.update(
                                    {unit_col: lookup_row.get(unit_col, "")}
                                )
                        result = FormulaCalculator.calculate(
                            columns=addon_columns,
                            quantity_dict={metric_key: quantity},
                            data=addon_values,
                        )
                        list_total_price = result[addon_output_key[metric_key]]
                        discounted_total_price = list_total_price
                        discount_percent = 0
                        list_discounted_unit_price = {}
                        if (
                                discounted_total_price_dict
                                and discounted_total_price_dict.get(metric_key)
                        ):
                            discounted_total_price = discounted_total_price_dict[
                                metric_key
                            ]
                            discount_percent = (
                                (
                                        (list_total_price - discounted_total_price)
                                        / list_total_price
                                )
                                * 100
                                if (list_total_price and discounted_total_price) > 0
                                   and (list_total_price != discounted_total_price)
                                else 0
                            )
                            if quantity > 0:
                                list_discounted_unit_price = (
                                    {unit_columns[0]: discounted_total_price / quantity}
                                    if len(unit_columns) == 1
                                    else {}
                                )
                        if (
                                discounted_list_unit_price_dict
                                and discounted_list_unit_price_dict.get(metric_key)
                        ):
                            addon_discounted_units = discounted_list_unit_price_dict[
                                metric_key
                            ]
                            result = FormulaCalculator.calculate(
                                columns=addon_columns,
                                quantity_dict={metric_key: quantity},
                                data=addon_values,
                                discounted_units=addon_discounted_units,
                            )
                            list_discounted_unit_price = {
                                key: value
                                for key, value in addon_discounted_units.items()
                            }
                            discounted_total_price = result[
                                addon_output_key[metric_key]
                            ]
                            discount_percent = (
                                (
                                        (list_total_price - discounted_total_price)
                                        / list_total_price
                                )
                                * 100
                                if (list_total_price and discounted_total_price) > 0
                                   and (list_total_price != discounted_total_price)
                                else 0
                            )
                        addon_response[metric_key] = {
                            "list_unit_price": list_unit_price,
                            "discounted_unit_price": list_discounted_unit_price,
                            "discounted_total_price": discounted_total_price
                            if discounted_total_price
                            else list_total_price,
                            "list_total_price": list_total_price,
                            "discount": round(discount_percent, 3)
                            if discount_percent
                            else 0,
                        }
                    response["addon_output"].append({addon["id"]: addon_response})
                else:
                    addon_item = addon["details"]
                    quantity = addons_config[addon["id"]]
                    discounted_total_price = addons_discounted_total_price_config[
                        addon["id"]
                    ]
                    if addon_item["model"] == "Fixed Price":
                        addon_amount = int(addon_item["fee"].replace("$", ""))
                        addon_line_item["list_unit_price"] = addon_amount
                        addon_line_item["list_total_price"] = addon_amount * quantity
                    else:
                        core_proportion = (
                                                  int(addon_item["fee"].replace("%", ""))
                                                  * response["core_total_output"]
                                          ) // 100
                        if (
                                int(addon_item["min"])
                                <= core_proportion
                                <= int(addon_item["max"])
                        ):
                            addon_amount = core_proportion
                        else:
                            addon_amount = (
                                int(addon_item["min"])
                                if core_proportion < int(addon_item["min"])
                                else int(addon_item["max"])
                            )
                        addon_line_item["list_unit_price"] = addon_amount
                        addon_line_item["list_total_price"] = addon_amount * quantity
                    if discounted_total_price:
                        addon_line_item[
                            "discounted_total_price"
                        ] = discounted_total_price
                        addon_line_item["discount"] = (
                                                              (
                                                                      addon_line_item["list_total_price"]
                                                                      - discounted_total_price
                                                              )
                                                              / addon_line_item["list_total_price"]
                                                      ) * 100
                        addon_line_item["discount"] = round(
                            addon_line_item["discount"], 2
                        )
                    else:
                        addon_line_item["discounted_total_price"] = addon_line_item[
                            "list_total_price"
                        ]
                        addon_line_item["discount"] = 0
                    response["addon_output"].append({addon["id"]: addon_line_item})
            return ResponseBuilder.success(data=response)
        except PricingModelDetails.DoesNotExist:
            return ResponseBuilder.errors()
