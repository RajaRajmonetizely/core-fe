import json
import uuid

from django.db.models import F
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from api.account.models import Account, IndustryType, AccountHistory
from api.account.serializers.account import AccountSerializer, IndustryTypeSerializer, \
    AccountCreateSerializer
from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import AccountDoesNotExistsException, \
    IndustryTypeDoesNotExistsException
from api.utils.responses import ResponseBuilder


class AccountViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        queryset = self.queryset.filter(is_deleted=False, tenant_id=tenant_id)
        queryset = queryset.order_by(F("created_on").desc())
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        data = []
        model_fields = Account._meta.get_fields()

        for entry in queryset:
            # Create a dictionary with all the field names and their values
            entry_data = {field.name: getattr(entry, field.name) for field in model_fields if
                          not field.is_relation}

            # Include additional fields like owner_name and industry_type_name
            entry_data["owner_name"] = entry.owner_id.name if entry.owner_id else None
            entry_data[
                "industry_type_name"] = entry.industry_type_id.name if entry.industry_type_id else None
            entry_data["created_by_name"] = entry.created_by.name if entry.created_by else None
            entry_data["updated_by_name"] = entry.updated_by.name if entry.updated_by else None

            # Include the foreign key fields in the entry_data dictionary
            entry_data["owner_id"] = entry.owner_id.id if entry.owner_id else None
            entry_data[
                "industry_type_id"] = entry.industry_type_id.id if entry.industry_type_id else None
            entry_data["tenant_id"] = entry.tenant_id.id if entry.tenant_id else None
            entry_data["created_by"] = entry.created_by.id if entry.created_by else None
            entry_data["updated_by"] = entry.updated_by.id if entry.updated_by else None

            data.append(entry_data)

        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance:
            serializer = self.get_serializer(instance)
            data = serializer.data

            # Include owner name and industry name in the response
            data["owner_name"] = (
                instance.owner_id.name if instance.owner_id else None
            )
            data["industry_name"] = (
                instance.industry_type_id.name if instance.industry_type_id else None
            )

            return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)
        else:
            return ResponseBuilder.errors(
                message="Account not found", status_code=status.HTTP_404_NOT_FOUND
            )

    @swagger_auto_schema(
        request_body=AccountCreateSerializer,
    )
    def create(self, request, *args, **kwargs):
        try:
            tenant_id = get_tenant_id_from_email(request.user[0])
            request.data.update({"tenant_id": tenant_id})
            request.data["is_active"] = True
            serializer = AccountCreateSerializer(data=request.data)
            try:
                serializer.is_valid(raise_exception=True)
            except ValidationError as e:
                return ResponseBuilder.errors(message=e.detail, status_code=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            account_data = serializer.data

            # Create audit history entry
            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    account_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "account_id": Account.objects.get(id=account_data["id"]),
                        "description": "Creating an account",
                        "details": json.dumps({"new_data": CommonUtils.convert_uuids_to_strings(account_data)}),
                        "tenant_id": tenant_obj,
                    }
                    AccountHistory.objects.create(**account_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(
                data=account_data,
                status_code=status.HTTP_201_CREATED
            )

        except Exception as e:
            return ResponseBuilder.errors(
                message="Exception while creating an account",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @swagger_auto_schema(
        request_body=AccountSerializer,
    )
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if not instance:
                raise AccountDoesNotExistsException("Account not found")

            previous_account_data = AccountSerializer(instance).data

            serializer = self.get_serializer(instance, data=request.data, partial=True)
            try:
                serializer.is_valid(raise_exception=True)
            except ValidationError as e:
                return ResponseBuilder.errors(message=e.detail, status_code=status.HTTP_400_BAD_REQUEST)

            self.perform_update(serializer)
            updated_account_data = serializer.data

            # Create audit history entry
            try:
                if request.auth and request.auth[0]:
                    tenant_id = get_tenant_id_from_email(request.user[0])
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    account_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "account_id": instance,
                        "description": "Updating an account",
                        "details": json.dumps({
                            "new_data": CommonUtils.convert_uuids_to_strings(updated_account_data),
                            "previous_data": CommonUtils.convert_uuids_to_strings(previous_account_data)
                        }),
                        "tenant_id": tenant_obj,
                    }
                    AccountHistory.objects.create(**account_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(
                data=updated_account_data,
                status_code=status.HTTP_200_OK
            )

        except Exception as e:
            return ResponseBuilder.errors(
                message="Exception while updating an account",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        if not instance:
            raise AccountDoesNotExistsException("Account not found")
        instance.is_deleted = True
        instance.save()
        # Create audit history entry
        try:
            if request.auth and request.auth[0]:
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                account_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "account_id": instance,
                    "description": "Deleting an account",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                AccountHistory.objects.create(**account_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return ResponseBuilder.success(status_code=status.HTTP_200_OK)


class IndustryTypeViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = IndustryType.objects.all()
    serializer_class = IndustryTypeSerializer
    http_method_names = ["get", "put", "delete", "post"]

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(tenant_id=tenant_id, is_deleted=False)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise IndustryTypeDoesNotExistsException("Industry Type not found")

        serializer = self.get_serializer(instance)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        request_body=IndustryTypeSerializer,
    )
    def create(self, request, *args, **kwargs):
        request.data.update({"tenant_id": get_tenant_id_from_email(request.user[0])})
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(
        request_body=IndustryTypeSerializer,
    )
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise IndustryTypeDoesNotExistsException("Industry Type not found")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return ResponseBuilder.success(data=serializer.data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise IndustryTypeDoesNotExistsException("Industry Type not found")

        instance.is_deleted = True
        instance.save()
        return ResponseBuilder.success(status_code=status.HTTP_200_OK)
