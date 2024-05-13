import json

from django.db.models import F
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError

from ..auth.authentication import CognitoAuthentication
from ..feature_repository.models import Feature, FeatureGroup
from ..plan.models import Plan, Tier
from ..tenant.models import Tenant
from ..user.utils import get_tenant_id_from_email, get_user_obj_from_email
from ..utils.custom_exception_handler import (
    PackageDoesNotExistsException,
    PlanDoesNotExistsException, PackageDoesNotHaveTiersException,
)
from ..utils.logger import logger
from ..utils.responses import ResponseBuilder
from .models import Package, PackageDetail, PackageHistory
from .serializers import PackageSerializer, PackageUpdateSerializer


class PackageViewSet(viewsets.ModelViewSet):
    authentication_classes = [CognitoAuthentication]

    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    http_method_names = ["post", "get", "put"]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "plan_id",
                openapi.IN_QUERY,
                description="ID of the repository to inherit from",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        plan_id = request.query_params.get("plan_id")
        if plan_id:
            logger.info(f"listing all the packages for given plan id - {plan_id}")
            result_set = Package.objects.filter(plan_id=plan_id, tenant_id=tenant_id)
        else:
            logger.info(f"listing all the packages for given tenant id - {tenant_id}")
            result_set = (
                Package.objects.all()
                .filter(tenant_id=tenant_id)
                .order_by(F("created_on").desc())
            )
        serializer = self.get_serializer_class()
        packages = serializer(result_set, many=True).data
        packages_list = [{"id": item["id"], "name": item["name"]} for item in packages]
        return ResponseBuilder.success(
            data=packages_list, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "source",
                openapi.IN_QUERY,
                description="ID of the repository to inherit from",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def create(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
        request.data.update({"tenant_id": tenant_id})

        package_id = request.query_params.get("source")
        if package_id:
            logger.info(f"cloning the existing packgae - {package_id}")
            existing_package = Package.objects.filter(
                id=package_id, tenant_id=tenant_id, is_deleted=False
            ).first()

            if existing_package.name == request.data["name"]:
                logger.error(
                    f"package with name '{existing_package.name}' already exists"
                )
                return ResponseBuilder.errors(
                    message=f"A Package with name '{existing_package.name}' already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            if not existing_package:
                logger.error(f"package with given id - {package_id} does not exists")
                raise PackageDoesNotExistsException("Package Does Not Exist")
            try:
                obj = super(PackageViewSet, self).create(request, *args, **kwargs).data
            except ValidationError as e:
                logger.error(e.detail)
                return ResponseBuilder.errors(
                    message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
                )
            package_details = PackageDetail.objects.filter(
                package_id=existing_package.id, tenant_id=tenant_id
            )
            package = Package.objects.get(
                id=obj["id"], tenant_id=tenant_id, is_deleted=False
            )
            for item in package_details:
                tier = Tier.objects.get(
                    id=item.tier_id.id, tenant_id=tenant_id, is_deleted=False
                )
                if not tier.is_deleted:
                    PackageDetail.objects.create(
                        package_id=package,
                        tier_id=tier,
                        details=item.details,
                        tenant_id=tenant,
                    )
            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info("package cloned - this request is for user impersonation")
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                PackageHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description="Package Cloned",
                    tenant_id=tenant_obj,
                    package_id=package,
                    details=json.dumps({"cloned_package_id": str(existing_package.id)}),
                )

            return ResponseBuilder.success(
                message="Package cloned successfully",
                data={"id": obj["id"], "name": obj["name"]},
                status_code=status.HTTP_201_CREATED,
            )
        else:
            # Check if a package with the same name already exists
            existing_package_name = request.data["name"]
            existing_package_with_same_name = Package.objects.filter(
                name=existing_package_name,
                plan_id=request.data["plan_id"],
                tenant_id=tenant_id,
                is_deleted=False,
            ).first()
            if existing_package_with_same_name:
                logger.error(
                    f"package with name '{existing_package_name}' already exists."
                )
                return ResponseBuilder.errors(
                    message=f"A Package with name '{existing_package_name}' already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            try:
                obj = super(PackageViewSet, self).create(request, *args, **kwargs).data
            except ValidationError as e:
                logger.error(e.detail)
                return ResponseBuilder.errors(
                    message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
                )
            tier_details = Tier.objects.filter(
                plan_id=obj["plan_id"], tenant_id=tenant_id, is_deleted=False
            )
            if not tier_details:
                raise PackageDoesNotHaveTiersException("Minimum one tier should be available")
            package = Package.objects.get(
                id=obj["id"], tenant_id=tenant_id, is_deleted=False
            )
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            for item in tier_details:
                tier = Tier.objects.get(
                    id=item.id, tenant_id=tenant_id, is_deleted=False
                )
                if not tier.is_deleted:
                    PackageDetail.objects.create(
                        package_id=package,
                        tier_id=tier,
                        details=json.dumps({}),
                        tenant_id=tenant_obj,
                    )
            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info("package created - this request is for user impersonation")
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                PackageHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description="Package Created",
                    tenant_id=tenant_obj,
                    package_id=package,
                    details=json.dumps({}),
                )
            return ResponseBuilder.success(
                data={"id": obj["id"], "name": obj["name"]},
                status_code=status.HTTP_201_CREATED,
            )

    def retrieve(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        package_details = PackageDetail.objects.filter(
            package_id=kwargs["pk"], tenant_id=tenant_id, tier_id__is_deleted=False
        ).order_by("created_on")

        package_obj = Package.objects.filter(id=kwargs["pk"], is_deleted=False).first()
        if not package_obj:
            logger.error(f'package does not exists for given id - {kwargs["pk"]}')
            raise PackageDoesNotExistsException("Package Does Not Exist")

        plan_obj = Plan.objects.filter(
            id=package_obj.plan_id.id, is_deleted=False
        ).first()
        if not plan_obj:
            logger.error(
                f"plan does not exists for given id - {package_obj.plan_id.id}"
            )
            raise PlanDoesNotExistsException("Plan Does Not Exist")

        response = []
        for item in package_details:
            obj = {
                "tier_id": item.tier_id.id,
                "package_detail_id": item.id,
                "package_name": item.package_id.name,
                "tier_name": item.tier_id.name,
                "details": item.details,
                "repository_id": plan_obj.feature_repository_id.id,
            }
            if not item.details:
                response.append(obj)
                continue
            json_details = json.loads(item.details)
            if json_details:
                feature_groups_ids = []
                feature_ids = []
                for x in json_details.get("feature_groups", []):
                    feature_groups_ids.append(x.get("feature_group_id"))
                    feature_ids.extend(
                        [feature["feature_id"] for feature in x.get("features")]
                    )
                feature_ids.extend(
                    [
                        feature.get("feature_id")
                        for feature in json_details.get("features", [])
                    ]
                )

                feature_details = Feature.objects.filter(
                    id__in=feature_ids, tenant_id=tenant_id, is_deleted=False
                )
                feature_details_dict = {
                    str(item.id): (item.name, item.sort_order)
                    for item in feature_details
                }
                feature_group_details = FeatureGroup.objects.filter(
                    id__in=feature_groups_ids, tenant_id=tenant_id, is_deleted=False
                )
                feature_group_details_dict = {
                    str(item.id): (item.name, item.sort_order)
                    for item in feature_group_details
                }
                package_feature_group = json_details.get("feature_groups", [])
                package_feature_group = package_feature_group.copy() if package_feature_group else []
                for fg in package_feature_group:
                    if fg["feature_group_id"] in feature_group_details_dict:
                        fg["name"] = feature_group_details_dict[fg["feature_group_id"]][
                            0
                        ]
                        fg["sort_order"] = feature_group_details_dict[
                            fg["feature_group_id"]
                        ][1]
                        package_feature = fg.get("features")
                        for fe in package_feature.copy():
                            if fe["feature_id"] in feature_details_dict:
                                fe["name"] = feature_details_dict[fe["feature_id"]][0]
                                fe["sort_order"] = feature_details_dict[
                                    fe["feature_id"]
                                ][1]
                            else:
                                package_feature.remove(fe)
                    else:
                        package_feature_group.remove(fg)
                package_feature = json_details.get("features", [])
                package_feature = package_feature.copy() if package_feature else []
                for fe in package_feature:
                    if fe["feature_id"] in feature_details_dict:
                        fe["name"] = feature_details_dict[fe["feature_id"]][0]
                        fe["sort_order"] = feature_details_dict[fe["feature_id"]][1]
                    else:
                        package_feature.remove(fe)
            obj["details"] = json_details
            response.append(obj)
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=PackageUpdateSerializer(many=True))
    def update(self, request, *args, **kwargs):
        logger.info("in package update")
        # TODO: Add validations with other ids which are being used.
        # TODO: Add data validation before entering the data in the database.
        tenant_id = get_tenant_id_from_email(request.user[0])
        form_data = request.data

        prev_data = []
        new_updated_data = []
        for item in form_data:
            previous_data = {}
            new_data = {}
            previous_data["package_detail_id"] = item.get("package_detail_id")
            new_data["package_detail_id"] = item.get("package_detail_id")
            data = {k: item.get(k) for k in ("features", "feature_groups") if k in item}
            new_data["details"] = data
            package_detail_obj = PackageDetail.objects.filter(
                id=item["package_detail_id"], tenant_id=tenant_id
            )
            if package_detail_obj:
                previous_data["details"] = package_detail_obj[0].details
                package_detail_obj[0].details = json.dumps(data)
                package_detail_obj[0].save()
                prev_data.append(previous_data)
                new_updated_data.append(new_data)

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info("package updated - this request is for user impersonation")
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            package_obj = Package.objects.get(
                id=kwargs["pk"], tenant_id=tenant_id, is_deleted=False
            )
            PackageHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Package Updated",
                tenant_id=tenant_obj,
                package_id=package_obj,
                details=json.dumps(
                    {"new_data": new_updated_data, "previous_data": prev_data}
                ),
            )
        return ResponseBuilder.success(
            message="Package updated successfully", status_code=status.HTTP_201_CREATED
        )
