import json
import uuid

from django.db.models import F
from django.db.models import Prefetch
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError

from api.utils.responses import ResponseBuilder
from ..models import Opportunity, Account, Contract, OpportunityStage, OpportunityType, OpportunityHistory
from ..serializers.opportunity import OpportunitySerializer
from ...auth.authentication import CognitoAuthentication
from ...tenant.models import Tenant
from ...user.models import User, UserRole, UserRoleMapping
from ...user.utils import get_tenant_id_from_email, get_user_obj_from_email
from ...utils.common.common_utils import CommonUtils
from ...utils.custom_exception_handler import OpportunityDoesNotExistsException


class OpportunityViewSet(viewsets.ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        user_obj = get_user_obj_from_email(self.request.user[0])

        user_role_names = UserRoleMapping.objects.filter(
            user_id=user_obj.id, is_deleted=False
        ).values_list("user_role_id__name", flat=True)

        is_deal_desk = "Deal Desk" in user_role_names
        is_implementation_analyst = "Implementation Analyst" in user_role_names

        account_id = self.request.query_params.get("account_id")

        if is_deal_desk or is_implementation_analyst:
            queryset = self.queryset.filter(is_deleted=False, tenant_id=tenant_id)
        else:
            queryset = self.queryset.filter(
                is_deleted=False, tenant_id=tenant_id, owner_id=user_obj.id
            )

        if account_id:
            queryset = queryset.filter(account_id=account_id)
        queryset = queryset.order_by(F("created_on").desc())
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "account_id",
                openapi.IN_QUERY,
                description="Filter opportunities by account_id",
                type=openapi.TYPE_STRING,
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        data = []
        for entry, serialized_entry in zip(queryset, serializer.data):

            serialized_entry["account_name"] = entry.account_id.name if entry.account_id else None
            serialized_entry["owner_name"] = entry.owner_id.name if entry.owner_id else None
            serialized_entry["stage_name"] = entry.stage_id.name if entry.stage_id else None
            serialized_entry["type_name"] = entry.type_id.name if entry.type_id else None
            serialized_entry["created_by_name"] = entry.created_by.name if entry.created_by else None
            serialized_entry["updated_by_name"] = entry.updated_by.name if entry.updated_by else None
            serialized_entry["contract_id_name"] = entry.contract_id.name if entry.contract_id else None

            data.append(serialized_entry)

        return ResponseBuilder.success(data=data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        data = serializer.data

        # Helper function to get the name from an object if it exists
        def get_name(obj):
            return obj.name if obj else None

        # Retrieve additional fields for the retrieved object
        data["account_name"] = get_name(instance.account_id)
        data["owner_name"] = get_name(instance.owner_id)
        data["stage_name"] = get_name(instance.stage_id)
        data["type_name"] = get_name(instance.type_id)
        data["created_by_name"] = get_name(instance.created_by)
        data["updated_by_name"] = get_name(instance.updated_by)
        data["contract_id_name"] = get_name(instance.contract_id)

        return ResponseBuilder.success(data=data)

    def create(self, request, *args, **kwargs):
        try:
            user_obj = get_user_obj_from_email(request.user[0])
            request.data.update(
                {"tenant_id": get_tenant_id_from_email(request.user[0])}
            )
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            self.perform_create(serializer)

            data = serializer.data
            data["account_name"] = (
                serializer.validated_data["account_id"].name
                if serializer.validated_data.get("account_id")
                else None
            )
            data["owner_name"] = (
                serializer.validated_data["owner_id"].name
                if serializer.validated_data.get("owner_id")
                else None
            )
            data["stage_name"] = (
                serializer.validated_data["stage_id"].name
                if serializer.validated_data.get("stage_id")
                else None
            )
            data["type_name"] = (
                serializer.validated_data["type_id"].name
                if serializer.validated_data.get("type_id")
                else None
            )
            data["created_by_name"] = user_obj.name
            data["updated_by_name"] = user_obj.name
            data["contract_id_name"] = (
                serializer.validated_data["contract_id"].name
                if serializer.validated_data.get("contract_id")
                else None
            )

            # Create audit history entry
            try:
                if request.auth and request.auth[0]:
                    tenant_id = get_tenant_id_from_email(request.user[0])
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    opportunity_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "opportunity_id": serializer.instance,
                        "description": "Creating an opportunity",
                        "details": json.dumps({"new_data": CommonUtils.convert_uuids_to_strings(data)}),
                        "tenant_id": tenant_obj,
                    }
                    OpportunityHistory.objects.create(**opportunity_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(
                data=data, status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityDoesNotExistsException("Opportunity not found")
        previous_data = OpportunitySerializer(instance).data
        user_obj = get_user_obj_from_email(request.user[0])
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )

        self.perform_update(serializer)

        data = serializer.data
        data["account_name"] = (
            serializer.validated_data["account_id"].name
            if serializer.validated_data.get("account_id")
            else None
        )
        data["owner_name"] = (
            serializer.validated_data["owner_id"].name
            if serializer.validated_data.get("owner_id")
            else None
        )
        data["stage_name"] = (
            serializer.validated_data["stage_id"].name
            if serializer.validated_data.get("stage_id")
            else None
        )
        data["type_name"] = (
            serializer.validated_data["type_id"].name
            if serializer.validated_data.get("type_id")
            else None
        )
        data["created_by_name"] = (
            serializer.validated_data["created_by"].name
            if serializer.validated_data.get("created_by")
            else None
        )
        data["updated_by_name"] = user_obj.name
        data["contract_id_name"] = (
            serializer.validated_data["contract_id"].name
            if serializer.validated_data.get("contract_id")
            else None
        )

        # Create audit history entry
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_id": instance,
                    "description": "Updating an opportunity",
                    "details": json.dumps({
                        "new_data": CommonUtils.convert_uuids_to_strings(data),
                        "previous_data": CommonUtils.convert_uuids_to_strings(previous_data),
                    }),
                    "tenant_id": tenant_obj,
                }
                OpportunityHistory.objects.create(**opportunity_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityDoesNotExistsException("Opportunity not found")

        instance.is_deleted = True
        instance.save()

        # Create audit history entry
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_id": instance,
                    "description": "Deleting a opportunity",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                OpportunityHistory.objects.create(**opportunity_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return ResponseBuilder.success(status_code=status.HTTP_200_OK)
