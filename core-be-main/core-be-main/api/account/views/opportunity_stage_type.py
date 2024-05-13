import json
import uuid

from django.db.models import F
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from api.account.models import OpportunityStage, OpportunityType, OpportunityStageHistory, OpportunityTypeHistory
from api.account.serializers.opportunity_stage_type import (
    OpportunityStageSerializer,
    OpportunityTypeSerializer,
)
from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import OpportunityStageDoesNotExistsException, \
    OpportunityTypeDoesNotExistsException, OpportunityStageNameAlreadyExistsException, \
    OpportunityTypeNameAlreadyExistsException
from api.utils.responses import ResponseBuilder


class OpportunityStageViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = OpportunityStage.objects.all()
    serializer_class = OpportunityStageSerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(is_deleted=False, tenant_id=tenant_id).order_by(
            F("created_on").desc())

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return ResponseBuilder.success(
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityStageDoesNotExistsException("Opportunity stage not found")

        serializer = self.get_serializer(instance)
        return ResponseBuilder.success(
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        request.data.update({"tenant_id": get_tenant_id_from_email(request.user[0])})
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )

        self.perform_create(serializer)

        new_opportunity_stage_data = serializer.data

        # Create audit history entry
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_stage_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_stage_id": serializer.instance,
                    "description": "Creating an opportunity stage",
                    "details": json.dumps({
                        "new_data": CommonUtils.convert_uuids_to_strings(new_opportunity_stage_data),
                    }),
                    "tenant_id": tenant_obj,
                }
                OpportunityStageHistory.objects.create(**opportunity_stage_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityStageDoesNotExistsException("Opportunity stage not found")

        instance.is_deleted = True
        instance.save()

        # Create audit history entry for delete
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_stage_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_stage_id": instance,
                    "description": "Deleting an opportunity stage",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                OpportunityStageHistory.objects.create(**opportunity_stage_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(status_code=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        if not instance:
            raise OpportunityStageDoesNotExistsException("Opportunity stage not found")

        opportunity_stage_obj = OpportunityStage.objects.filter(
            name=request.data.get('name'), is_deleted=False, tenant_id=tenant_id)
        if opportunity_stage_obj:
            raise OpportunityStageNameAlreadyExistsException(
                'Stage {} already exists'.format(request.data.get('name')))
        previous_data = OpportunityStageSerializer(instance).data

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )

        self.perform_update(serializer)

        # Create audit history entry for update
        try:
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_stage_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_stage_id": instance,
                    "description": "Updating an opportunity stage",
                    "details": json.dumps({
                        "new_data": CommonUtils.convert_uuids_to_strings(serializer.data),
                        "previous_data": CommonUtils.convert_uuids_to_strings(previous_data),
                    }),
                    "tenant_id": tenant_obj,
                }
                OpportunityStageHistory.objects.create(**opportunity_stage_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(data=serializer.data)


class OpportunityTypeViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = OpportunityType.objects.all()
    serializer_class = OpportunityTypeSerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(is_deleted=False, tenant_id=tenant_id).order_by(
            F("created_on").desc())

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return ResponseBuilder.success(
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityTypeDoesNotExistsException("Opportunity type not found")

        serializer = self.get_serializer(instance)
        return ResponseBuilder.success(
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        try:
            user_obj = get_user_obj_from_email(request.user[0])
            request.data.update({"tenant_id": get_tenant_id_from_email(request.user[0])})
            serializer = self.get_serializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            data = serializer.data

            # Create audit history entry for create
            try:
                if request.auth and request.auth[0]:
                    tenant_id = get_tenant_id_from_email(request.user[0])
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    opportunity_type_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "opportunity_type_id": serializer.instance,
                        "description": "Creating an opportunity type",
                        "details": json.dumps({"new_data": CommonUtils.convert_uuids_to_strings(data)}),
                        "tenant_id": tenant_obj,
                    }
                    OpportunityTypeHistory.objects.create(**opportunity_type_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(data=data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise OpportunityTypeDoesNotExistsException("Opportunity type not found")

        instance.is_deleted = True
        instance.save()

        # Create audit history entry for delete
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_type_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_type_id": instance,
                    "description": "Deleting an opportunity type",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                OpportunityTypeHistory.objects.create(**opportunity_type_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(status_code=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        if not instance:
            raise OpportunityTypeDoesNotExistsException("Opportunity type not found")

        opportunity_stage_obj = OpportunityType.objects.filter(
            name=request.data.get('name'), is_deleted=False, tenant_id=tenant_id)
        if opportunity_stage_obj:
            raise OpportunityTypeNameAlreadyExistsException(
                'Type {} already exists'.format(request.data.get('name')))

        previous_data = OpportunityTypeSerializer(instance).data

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )

        self.perform_update(serializer)

        # Create audit history entry for update
        try:
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                opportunity_type_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "opportunity_type_id": instance,
                    "description": "Updating an opportunity type",
                    "details": json.dumps({
                        "new_data": CommonUtils.convert_uuids_to_strings(serializer.data),
                        "previous_data": CommonUtils.convert_uuids_to_strings(previous_data),
                    }),
                    "tenant_id": tenant_obj,
                }
                OpportunityTypeHistory.objects.create(**opportunity_type_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(data=serializer.data)
