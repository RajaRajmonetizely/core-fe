import json

from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.plan.models import Tier, Plan, PlanHistory
from api.plan.serializers import (
    TierCreateSerializer,
    TierDeleteSerializer,
    TierSerializer,
    TierUpdateSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import (
    TierDoesNotExistsException,
    TierAlreadyExistsException, PackageDoesNotHaveTiersException,
)
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class TierCreateView(GenericAPIView):
    serializer_class = TierCreateSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        request_body=TierCreateSerializer,
    )
    def post(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan_id = serializer.validated_data["plan_id"]
        tier_names = serializer.validated_data["tier_names"]
        logger.info(f"creating tiers for a plan id - {plan_id}")
        created_tiers = []
        errors = []

        for tier_name in tier_names:
            tier_data = {"name": tier_name, "plan_id": plan_id, "tenant_id": tenant_id}
            existing_tier = Tier.objects.filter(
                tenant_id=tenant_id, name=tier_name, plan_id=plan_id, is_deleted=False
            ).first()
            if existing_tier:
                raise TierAlreadyExistsException(
                    "A Tier with the same name already exists."
                )
            tier_serializer = TierSerializer(data=tier_data)

            if tier_serializer.is_valid():
                tier = tier_serializer.save()
                created_tiers.append(tier_serializer.data)
            else:
                errors.append(tier_serializer.errors)

        if errors:
            return ResponseBuilder.errors(
                message="Invalid data in the request",
                data=errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info("Adding new tiers - this request is for user impersonation")
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            plan_obj = Plan.objects.get(
                id=plan_id, is_deleted=False, tenant_id=tenant_id
            )
            PlanHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Added new tiers",
                tenant_id=tenant_obj,
                plan_id=plan_obj,
                details=json.dumps({"new_data": tier_names}),
            )

        return ResponseBuilder.success(
            message="Tiers created successfully",
            data=created_tiers,
            status_code=status.HTTP_201_CREATED,
        )


class TierView(GenericAPIView):
    serializer_class = TierUpdateSerializer
    authentication_classes = [CognitoAuthentication]

    def patch(self, request, id):
        logger.info(f"updating tiers for a plan id - {id}")
        tenant_id = get_tenant_id_from_email(request.user[0])
        tier_data = request.data

        tier_id = tier_data.get("tier_id")
        tier_name = tier_data.get("name")

        try:
            tier = Tier.objects.get(
                id=tier_id, plan_id=id, is_deleted=False, tenant_id=tenant_id
            )
            previous_data = {"name": tier.name}
            serializer = TierSerializer(
                tier, data={"name": tier_name, "tenant_id": tenant_id}, partial=True
            )
            existing_tier = Tier.objects.filter(
                tenant_id=tenant_id, name=tier_name, plan_id=id, is_deleted=False
            ).first()
            if existing_tier and existing_tier.id != tier.id:
                raise TierAlreadyExistsException(
                    "A Tier with the same name already exists."
                )
            if serializer.is_valid():
                serializer.save()

                # check for user impersonation
                if request.auth and request.auth[0]:
                    logger.info(
                        "updating tiers - this request is for user impersonation"
                    )
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    plan_obj = Plan.objects.get(
                        id=tier.plan_id.id, is_deleted=False, tenant_id=tenant_id
                    )
                    PlanHistory.objects.create(
                        admin_user_id=request.auth[1],
                        user_id=get_user_obj_from_email(request.user[0]),
                        description="Updated a tier",
                        tenant_id=tenant_obj,
                        plan_id=plan_obj,
                        details=json.dumps(
                            {
                                "new_data": {"name": tier_name},
                                "previous_data": previous_data,
                            }
                        ),
                    )

                return ResponseBuilder.success(
                    message="Tiers updated successfully",
                    data=serializer.data,
                    status_code=status.HTTP_200_OK,
                )
        except Tier.DoesNotExist:
            ResponseBuilder.errors(
                message="Invalid data in the request",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    @swagger_auto_schema(
        request_body=TierDeleteSerializer,
    )
    def delete(self, request, id):
        logger.info(f"deleting tiers for a plan id - {id}")
        tenant_id = get_tenant_id_from_email(request.user[0])
        serializer = TierDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tier_id = serializer.validated_data["tier_id"]

        tier_details = Tier.objects.filter(plan_id=id, tenant_id=tenant_id, is_deleted=False).count()
        if tier_details == 1:
            raise PackageDoesNotHaveTiersException("Minimum one tier should be available for existing package")

        tier = Tier.objects.filter(
            id=tier_id, plan_id=id, is_deleted=False, tenant_id=tenant_id
        ).first()
        if not tier:
            raise TierDoesNotExistsException("Tier not found")
        tier.is_deleted = True
        tier.save()

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info("deleting tiers - this request is for user impersonation")
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            plan_obj = Plan.objects.get(
                id=tier.plan_id.id, is_deleted=False, tenant_id=tenant_id
            )
            PlanHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Deleted a tier",
                tenant_id=tenant_obj,
                plan_id=plan_obj,
                details=json.dumps(
                    {"new_data": {"tier_id": str(tier.id), "name": tier.name}}
                ),
            )

        return ResponseBuilder.success(message="Tier Deleted Successfully")
