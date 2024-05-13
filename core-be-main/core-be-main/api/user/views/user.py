import csv
import io
import json
import uuid
from datetime import datetime

from django.db import transaction
from django.db.models import F
from django.forms.models import model_to_dict
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import parsers, status
from rest_framework.generics import GenericAPIView
from rest_framework.viewsets import ModelViewSet

from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.models import User, UserRole, UserRoleMapping, UserHistory
from api.user.serializers import (
    UserCreateCSVSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.aws_utils.aws_user_management import AwsUserManagement
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import UserCreationFailedException, FileNotFoundException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class UserCreateFromCSVView(GenericAPIView):
    serializer_class = UserCreateCSVSerializer

    def post(self, request):
        logger.info("creating users from a CSV File")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_list = serializer.validated_data.get("user_list", [])

        all_users = []
        with transaction.atomic():
            for user_data in user_list:
                user_serializer = UserCreateSerializer(data=user_data)
                user_serializer.is_valid(raise_exception=True)
                try:
                    response_code, cognito_user = AwsUserManagement().add_user(
                        user_data=user_data
                    )
                    if response_code != status.HTTP_200_OK:
                        logger.error("User creation failed in Cognito")
                        raise UserCreationFailedException(
                            "User creation failed in Cognito"
                        )
                    user = user_serializer.save()
                    serialized_user = user_serializer.data
                    all_users.append(serialized_user)
                except Exception as e:
                    logger.exception(f"Exception while creating user - {str(e)}")
                    return ResponseBuilder.errors(
                        message="Exception while creating user",
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

        return ResponseBuilder.success(
            message="Users created successfully",
            status_code=status.HTTP_201_CREATED,
            data=all_users,
        )


class UserViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    http_method_names = ["get", "put", "delete", "post"]
    lookup_field = "id"

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(is_deleted=False, tenant_id=tenant_id)

    @swagger_auto_schema(
        request_body=UserCreateSerializer,
        responses={
            status.HTTP_201_CREATED: UserSerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid data in the request",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "User creation failed in Cognito",
        },
    )
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        logger.info("creating a user for a tenant")
        request.data.update({"tenant_id": get_tenant_id_from_email(request.user[0])})
        user_roles = request.data.pop("user_roles", [])
        is_monetizely_user = request.data.get("is_monetizely_user", False)
        logger.info(f"is_monetizely_user - {is_monetizely_user}")
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            try:
                if is_monetizely_user:
                    # Create the user in Cognito
                    response_code, cognito_user = AwsUserManagement().enable_user(
                        username=request.data.get("email"),
                    )
                    if response_code != status.HTTP_200_OK:
                        return ResponseBuilder.errors(
                            message=cognito_user,
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )

                    serializer.validated_data.update(
                        cognito_user_id=cognito_user.get("sub")
                        if cognito_user
                        else None
                    )
                    user = serializer.save()
                else:
                    # Only update the user roles without creating the user in Cognito
                    user = serializer.save()

                # Call the custom method to update user roles
                self._update_user_roles(user, user_roles)
                user_data = self._get_user_data_with_related_fields(user)

                # Create audit history entry
                try:
                    if request.auth and request.auth[0]:
                        tenant_id = get_tenant_id_from_email(request.user[0])
                        tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                        user_history_data = {
                            "admin_user_id": request.auth[1],
                            "user_id": get_user_obj_from_email(request.user[0]),
                            "user_model_id": user,
                            "description": "Creating a user",
                            "details": json.dumps(
                                {
                                    "new_data": CommonUtils.convert_uuids_to_strings(
                                        user_data
                                    )
                                }
                            ),
                            "tenant_id": tenant_obj,
                        }
                        UserHistory.objects.create(**user_history_data)

                except Exception as e:
                    return ResponseBuilder.errors(
                        message="Error creating audit history entry: " + str(e),
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                return ResponseBuilder.success(
                    message="User created successfully",
                    data=user_data,
                    status_code=status.HTTP_201_CREATED,
                )

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Exception while creating user",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return ResponseBuilder.errors(
            data=serializer.errors,
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ResponseBuilder.success(
            data=self._get_user_data_with_related_fields(serializer.instance),
            status_code=status.HTTP_200_OK,
        )

    @swagger_auto_schema(
        request_body=UserCreateSerializer,
        responses={
            status.HTTP_201_CREATED: UserSerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid data in the request",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "User creation failed in Cognito",
        },
    )
    def update(self, request, *args, **kwargs):
        logger.info("updating a user details")
        instance = self.get_object()
        previous_data = UserSerializer(instance).data

        # Pop the user_roles data from the request data
        user_roles = request.data.pop("user_roles", [])
        is_monetizely_user = request.data.get("is_monetizely_user", False)
        logger.info(f"is_monetizely_user - {is_monetizely_user}")

        serializer = UserSerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                # If the user is monetizely user, create the user in Cognito and update user roles
                if is_monetizely_user:
                    response_code, cognito_user = AwsUserManagement().enable_user(
                        username=instance.email, is_user_update=True
                    )
                    if response_code != status.HTTP_200_OK:
                        return ResponseBuilder.errors(
                            message=cognito_user,
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )
                    serializer.save()
                else:
                    # Disable the user in Cognito
                    AwsUserManagement().disable_user(username=instance.email)
                    serializer.save()

                self._update_user_roles(instance, user_roles)
                user_data = self._get_user_data_with_related_fields(serializer.instance)

                # Create audit history entry
                try:
                    if request.auth and request.auth[0]:
                        tenant_id = get_tenant_id_from_email(request.user[0])
                        tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                        user_history_data = {
                            "admin_user_id": request.auth[1],
                            "user_id": get_user_obj_from_email(request.user[0]),
                            "user_model_id": instance,
                            "description": "Updating a user",
                            "details": json.dumps(
                                {
                                    "new_data": CommonUtils.convert_uuids_to_strings(
                                        user_data
                                    ),
                                    "previous_data": CommonUtils.convert_uuids_to_strings(
                                        previous_data
                                    ),
                                }
                            ),
                            "tenant_id": tenant_obj,
                        }
                        UserHistory.objects.create(**user_history_data)

                except Exception as e:
                    return ResponseBuilder.errors(
                        message="Error creating audit history entry: " + str(e),
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                return ResponseBuilder.success(
                    data=user_data,
                    status_code=status.HTTP_200_OK,
                )

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Exception while updating user",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return ResponseBuilder.errors(data=serializer.errors)

    def _update_user_roles(self, user_instance, user_roles):
        logger.info("in _update_user_roles")
        # Fetch existing user roles for the user
        existing_roles = set(
            UserRoleMapping.objects.filter(user_id=user_instance).values_list(
                "user_role_id", flat=True
            )
        )

        # Soft delete UserRoleMapping entries for roles not present in the incoming data
        roles_to_delete = existing_roles - set(user_roles)
        UserRoleMapping.objects.filter(
            user_id=user_instance, user_role_id__in=roles_to_delete, is_deleted=False
        ).update(is_deleted=True)

        # Add new UserRoleMapping entries for roles in the incoming data but not present in the database
        roles_to_add = set(user_roles) - existing_roles
        for role_id in roles_to_add:
            user_role = UserRole.objects.get(id=role_id, is_deleted=False)
            UserRoleMapping.objects.create(
                user_id=user_instance, user_role_id=user_role, is_salesforce=False
            )

    def destroy(self, request, *args, **kwargs):
        logger.info("deleting a user")
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        try:
            AwsUserManagement().delete_user(username=instance.email)
            # logger.info("User deleted successfully from cognito")
        except Exception as err:
            pass
            # logger.info(f"Encountered {err}, couldn't delete user from cognito")

        # Create audit history entry
        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                user_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "user_model_id": instance,
                    "description": "Deleting a user",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                UserHistory.objects.create(**user_history_data)
        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseBuilder.success(message="User Deleted Successfully")

    def _get_user_data_with_related_fields(self, user):
        user_data = model_to_dict(user)
        user_data["id"] = user.id
        user_data["created_on"] = user.created_on
        user_data["updated_on"] = user.updated_on
        user_data["manager_name"] = user.manager_id.name if user.manager_id else None
        user_data["org_hierarchy_name"] = (
            user.org_hierarchy_id.name if user.org_hierarchy_id else None
        )
        user_data["created_by_name"] = user.created_by.name if user.created_by else None
        user_data["updated_by_name"] = user.updated_by.name if user.updated_by else None

        # Fetch UserRoleMapping data
        user_role_mappings = UserRoleMapping.objects.filter(user_id=user.id)
        user_role_data = [
            {"id": mapping.user_role_id.id, "name": mapping.user_role_id.name}
            for mapping in user_role_mappings
        ]
        user_data["user_roles"] = user_role_data

        return user_data


class UserListView(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return self.queryset.filter(is_deleted=False, tenant_id=tenant_id).order_by(
            F("created_on").desc()
        )

    def list(self, request, *args, **kwargs):
        users = self.filter_queryset(self.get_queryset())
        user_data = []

        for user in users:
            user_dict = model_to_dict(user)
            user_dict["id"] = user.id
            user_dict["created_on"] = user.created_on
            user_dict["updated_on"] = user.updated_on
            user_dict["manager_name"] = (
                user.manager_id.name if user.manager_id else None
            )
            user_dict["org_hierarchy_name"] = (
                user.org_hierarchy_id.name if user.org_hierarchy_id else None
            )
            user_dict["created_by_name"] = (
                user.created_by.name if user.created_by else None
            )
            user_dict["updated_by_name"] = (
                user.updated_by.name if user.updated_by else None
            )

            # Fetch related UserRoleMapping data
            user_role_mappings = UserRoleMapping.objects.filter(
                user_id=user.id, is_deleted=False
            )
            user_role_data = [
                {"id": mapping.user_role_id.id, "name": mapping.user_role_id.name}
                for mapping in user_role_mappings
            ]
            user_dict["user_role_mapping"] = user_role_data

            user_data.append(user_dict)

        return ResponseBuilder.success(
            data=user_data,
            status_code=status.HTTP_200_OK,
        )


class UserFromCSVView(GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    authentication_classes = [CognitoAuthentication]

    CSV_FIELDS_MAPPING = {
        "Email": "email",
        "Id": "id_ext_key",
        "ManagerId": "manager_id_ext_key",
        "Name": "name",
    }

    @swagger_auto_schema(
        operation_description="Upload a CSV file to create User objects.",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="CSV file containing User data.",
            )
        ],
    )
    def put(self, request):
        """Create or update User objects from a CSV file."""
        tenant_id = get_tenant_id_from_email(request.user[0])
        user_id = get_user_obj_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
        csv_file = request.FILES.get("file")
        if not csv_file:
            raise FileNotFoundException("No file uploaded.")
        try:
            csv_text = io.TextIOWrapper(csv_file, encoding="utf-8")
            csv_reader = csv.DictReader(csv_text)

            user_dict = {}

            for row in csv_reader:
                # Check if the row contains any data in the mapped fields
                if not any(row[field] for field in self.CSV_FIELDS_MAPPING):
                    continue  # Skip empty row and move to the next row

                # Extract the fields from the row and handle empty fields
                fields_data = {
                    csv_column: row.get(field_name) and row[field_name].strip()
                    for field_name, csv_column in self.CSV_FIELDS_MAPPING.items()
                }
                fields_data.update({"is_active": True})

                user_dict[fields_data["id_ext_key"]] = fields_data

            # Fetch existing user IDs and managers
            existing_user_ids = set(
                User.objects.filter(
                    id_ext_key__in=user_dict.keys(),
                    tenant_id=tenant_id,
                    is_deleted=False,
                ).values_list("id_ext_key", flat=True)
            )
            existing_managers = User.objects.filter(
                tenant_id=tenant_id, is_deleted=False
            )
            user_data_dict = {
                manager.id_ext_key: manager for manager in existing_managers
            }
            existing_user_emails = {user.email: user for user in existing_managers}

            users_to_update = []
            users_update_ids = []
            users_to_create = []

            with transaction.atomic():
                for external_id, user_data in user_dict.items():
                    id_ext_key = user_data.get("id_ext_key")
                    manager_id_ext_key = user_data.get("manager_id_ext_key", None)
                    # org_hierarchy_id_ext_key = user_data.get("org_hierarchy_id_ext_key", None)

                    if manager_id_ext_key:
                        manager_id = user_data_dict.get(manager_id_ext_key)
                        if manager_id:
                            user_data["manager_id"] = manager_id
                    # import pdb; pdb.set_trace()
                    if (
                        external_id not in existing_user_ids
                        and user_data.get("email") not in existing_user_emails
                    ):
                        created_user = User(
                            **user_data,
                            created_by=user_id,
                            updated_by=user_id,
                            tenant_id=tenant,
                        )
                        users_to_create.append(created_user)
                        user_data_dict[external_id] = created_user
                    if user_data.get("email") in existing_user_emails:
                        user_instance = existing_user_emails.get(user_data.get("email"))
                        user_instance.id_ext_key = id_ext_key
                        users_update_ids.append(user_instance)
                        user_data_dict[id_ext_key] = user_instance

                # Bulk create new users
                User.objects.bulk_create(users_to_create)

                # Bulk update id_ext_keys
                User.objects.bulk_update(users_update_ids, fields=["id_ext_key"])

                # Assign 'created_by', 'updated_by' and 'manager_id' fields to created_user
                for external_id, user_data in user_dict.items():
                    email = user_data.get("email")
                    if email in existing_user_emails:
                        user_instance = existing_user_emails.get(email)
                        for field, value in user_data.items():
                            setattr(user_instance, field, value)
                        user_instance.updated_by = user_id
                        users_to_update.append(user_instance)
                        continue

                    user_instance = user_data_dict.get(external_id)
                    if user_instance:
                        for field, value in user_data.items():
                            setattr(user_instance, field, value)
                        users_to_update.append(user_instance)

                # Include additional fields that are not in sf_field_mapping
                update_fields = list(self.CSV_FIELDS_MAPPING.values()) + [
                    "manager_id",
                    "updated_by",
                    "created_by",
                ]

                # Bulk update existing users
                User.objects.bulk_update(users_to_update, fields=update_fields)

            # Return success response
            return ResponseBuilder.success(status_code=status.HTTP_200_OK)
        except Exception as e:
            raise e
