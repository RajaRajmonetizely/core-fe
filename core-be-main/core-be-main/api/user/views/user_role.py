import csv
import io

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import parsers, status
from rest_framework.generics import GenericAPIView
from django.db.models import F

from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.models import UserRole
from api.user.serializers import UserRoleCreateSerializer, UserRoleSerializer
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import FileNotFoundException, \
    UserRoleDoesNotExistsException
from api.utils.responses import ResponseBuilder


class UserRoleCreateView(GenericAPIView):
    authentication_classes = [CognitoAuthentication]
    serializer_class = UserRoleCreateSerializer

    @staticmethod
    def post(request):
        serializer = UserRoleCreateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(
                message="User Role created successfully",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
            )

        return ResponseBuilder.errors(
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    def get(request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        user_roles = UserRole.objects.filter(tenant_id=tenant_id, is_deleted=False).order_by(F("created_on").desc())
        response = [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "id_ext_key": item.id_ext_key,
            }
            for item in user_roles
        ]
        return ResponseBuilder.success(
            message="User Role Fetched successfully",
            data=response,
            status_code=status.HTTP_201_CREATED,
        )


class UserRoleView(GenericAPIView):
    serializer_class = UserRoleSerializer

    @staticmethod
    def get(request, id):
        queryset = UserRole.objects.filter(id=id, is_deleted=False).first()
        if not queryset:
            raise UserRoleDoesNotExistsException("User Role not found")
        serializer = UserRoleSerializer(queryset)
        return ResponseBuilder.success(
            message="Fetched User Role", data=serializer.data, status_code=status.HTTP_200_OK)

    @staticmethod
    def patch(request, id):
        result = UserRole.objects.get(id=id, is_deleted=False)
        serializer = UserRoleCreateSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(data=serializer.data)
        else:
            return ResponseBuilder.errors(data=serializer.errors)

    @staticmethod
    def delete(request, id):
        result = UserRole.objects.get(id=id, is_deleted=False)
        result.is_deleted = True
        result.save()
        return ResponseBuilder.success(message="User Role Deleted Successfully")


class UserRoleFromCSVView(GenericAPIView):
    parser_classes = [parsers.MultiPartParser]
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        operation_description="Upload a CSV file to create UserRole objects.",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="CSV file containing UserRole data.",
            )
        ],
    )
    def put(self, request):
        """Create or update UserRole objects from a CSV file."""
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
        csv_file = request.FILES.get("file")
        if not csv_file:
            raise FileNotFoundException("No file uploaded.")

        try:
            csv_text = io.TextIOWrapper(csv_file, encoding="utf-8")
            csv_reader = csv.reader(csv_text)
            next(csv_reader)  # Skip the header row

            user_role_list = []

            for row in csv_reader:
                if not any(
                    row
                ):  # Check if the row is empty or contains only empty values
                    continue  # Skip empty row and move to the next row

                id_value, name = row[:2]

                existing_role = UserRole.objects.filter(
                    id_ext_key=id_value, tenant_id=tenant_id, is_deleted=False).first()
                if existing_role:
                    # Use the existing_role
                    user_role = existing_role
                else:
                    # Create a new user_role object
                    user_role = UserRole()
                    user_role.id_ext_key = id_value
                    user_role.tenant_id = tenant
                    user_role_list.append(user_role)

                # Set the properties of user_role object
                user_role.name = name
                user_role.description = ""

                user_role_list.append(user_role)

            # Bulk create or update the UserRole objects based on id_ext_key
            for user_role in user_role_list:
                if user_role.id_ext_key:
                    existing_role = UserRole.objects.filter(
                        id_ext_key=user_role.id_ext_key, tenant_id=tenant_id,
                        is_deleted=False).first()
                    if existing_role:
                        if existing_role.name != user_role.name:
                            existing_role.name = user_role.name
                        existing_role.save()
                    else:
                        user_role.save()

            # Mark roles as deleted
            existing_role_ext_keys = [role.id_ext_key for role in user_role_list]
            UserRole.objects.filter(tenant_id=tenant_id).exclude(
                id_ext_key__in=existing_role_ext_keys
            ).update(is_deleted=True, id_ext_key=None)

            # Return success response
            return ResponseBuilder.success(status_code=status.HTTP_200_OK)

        except Exception as e:
            return ResponseBuilder.errors(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
