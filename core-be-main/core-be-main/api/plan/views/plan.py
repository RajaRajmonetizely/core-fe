import json

from django.db.models import F
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import FeatureRepository
from api.plan.models import Plan, Tier, PlanHistory
from api.plan.serializers import (
    PlanCreateSerializer,
    PlanUpdateSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import PlanDoesNotExistsException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class PlanCreateView(GenericAPIView):
    serializer_class = PlanCreateSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "repository_id",
                openapi.IN_QUERY,
                description="ID of the Feature Repository to filter plans",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                required=False,
            ),
            openapi.Parameter(
                "product_id",
                openapi.IN_QUERY,
                description="ID of the Product to filter plans",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                required=False,
            ),
        ]
    )
    def get(request, id=None):
        tenant_id = get_tenant_id_from_email(request.user[0])
        repository_id = request.query_params.get("repository_id")
        product_id = request.query_params.get("product_id")

        if product_id:
            # Get all the feature repositories associated with the product
            logger.info(f'get all the feature repository for given product_id - {product_id}')
            feature_repositories = FeatureRepository.objects.filter(
                product_id=product_id, tenant_id=tenant_id, is_deleted=False
            )
            repository_ids = [repo.id for repo in feature_repositories]

            # Filter plans based on the retrieved feature repositories
            plans = Plan.objects.filter(
                tenant_id=tenant_id, feature_repository_id__in=repository_ids, is_deleted=False
            )
        else:
            logger.info(f'get all the plans for given tenant_id - {tenant_id}')
            plans = Plan.objects.filter(tenant_id=tenant_id, is_deleted=False).order_by(
                F("created_on").desc()).all()  # Fetch all plans initially
        if repository_id:
            logger.info(f'filtering data based on the repository_id - {repository_id}')
            plans = plans.filter(feature_repository_id=repository_id, is_deleted=False)

        response_data = []
        for plan in plans:
            tiers = Tier.objects.filter(plan_id=plan.id, is_deleted=False, tenant_id=tenant_id)
            tier_data = [{"id": tier.id, "name": tier.name} for tier in tiers]

            # Retrieve data from the Repository table based on repository_id
            repository = FeatureRepository.objects.filter(
                id=plan.feature_repository_id.id, tenant_id=tenant_id, is_deleted=False).first()
            if repository:
                product_id = repository.product_id.id

            plan_data = {
                "name": plan.name,
                "id": str(plan.id),
                "tiers": tier_data,
                "repository_id": plan.feature_repository_id.id,
                "product_id": product_id
            }
            response_data.append(plan_data)

        return ResponseBuilder.success(
            data=response_data, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "source",
                openapi.IN_QUERY,
                description="ID of the Plan to inherit from",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                required=False,
            ),
        ]
    )
    def post(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        plan_id = request.query_params.get("source")
        name = request.data.get("name")

        if plan_id:
            existing_plan = Plan.objects.get(id=plan_id, tenant_id=tenant_id, is_deleted=False)
            if not existing_plan:
                logger.error(f'clone plan - plan does not exists for given id - {plan_id}')
                raise PlanDoesNotExistsException("Plan Does Not Exist")

            if existing_plan.name == name:
                logger.error(f"plan with name '{name}' already exists")
                return ResponseBuilder.errors(
                    message=f"A Plan with name '{name}' already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            cloned_plan = Plan.objects.create(
                name=name, feature_repository_id=existing_plan.feature_repository_id,
                tenant_id=tenant_id)

            tiers = Tier.objects.filter(plan_id=plan_id, is_deleted=False, tenant_id=tenant_id)
            for tier in tiers:
                Tier.objects.create(name=tier.name, plan_id=cloned_plan, tenant_id=tenant_id)

            serializer = PlanCreateSerializer(cloned_plan)
            return ResponseBuilder.success(
                message="Plan cloned successfully",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
            )

        else:
            request.data.update({'tenant_id': tenant_id})
            # Check if a package with the same name already exists
            existing_plan_with_same_name = Plan.objects.filter(
                name=name, feature_repository_id=request.data['feature_repository_id'],
                tenant_id=tenant_id, is_deleted=False)
            if existing_plan_with_same_name:
                logger.error(f"plan with name '{name}' already exists")
                return ResponseBuilder.errors(
                    message=f"A Plan with name '{name}' already exists.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            serializer = PlanCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                response = serializer.data

                # check for user impersonation
                if request.auth and request.auth[0]:
                    logger.info('create plan - this request is for user impersonation')
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    plan_obj = Plan.objects.get(
                        id=response.get('id'), is_deleted=False, tenant_id=tenant_id)
                    PlanHistory.objects.create(
                        admin_user_id=request.auth[1],
                        user_id=get_user_obj_from_email(request.user[0]),
                        description='Plan Created',
                        tenant_id=tenant_obj,
                        plan_id=plan_obj,
                        details=json.dumps({})
                    )
                return ResponseBuilder.success(
                    message="Plan created successfully",
                    data={
                        'id': serializer.data.get("id"), 'name': serializer.data.get('name'),
                        'repository_id': serializer.data.get('feature_repository_id'),
                        'tenant_id': tenant_id},
                    status_code=status.HTTP_201_CREATED,
                )

            return ResponseBuilder.errors(
                message="Invalid data in the request",
                status_code=status.HTTP_400_BAD_REQUEST,
            )


class PlanView(GenericAPIView):
    serializer_class = PlanUpdateSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def patch(request, id):
        logger.info(f'updating the plan for given id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        result = Plan.objects.get(id=id, tenant_id=tenant_id)
        serializer = PlanUpdateSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(data=serializer.data)
        else:
            return ResponseBuilder.errors(data=serializer.errors)

    @staticmethod
    def delete(request, id):
        logger.info(f'deleting the plan for given id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        result = Plan.objects.get(id=id, tenant_id=tenant_id)
        result.is_deleted = True
        result.save()
        return ResponseBuilder.success(message="Tier Deleted Successfully")
