from collections import defaultdict

from django.db import transaction
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.viewsets import ModelViewSet

from api.account.models import Contract
from api.auth.authentication import CognitoAuthentication
from api.plan.models import Plan
from api.pricing.models import PricingModel
from api.pricing_calculator.models import Quote
from api.product.models import Product
from api.rbac.models import FeatureList, RoleFeatureMapping
from api.tenant.models import Tenant
from api.tenant.serializers import (
    TenantCreateSerializer,
    TenantSerializer,
    TenantUserCreateSerializer,
)
from api.user.models import User, UserRole, UserRoleMapping
from api.utils.aws_utils.aws_user_management import AwsUserManagement
from api.utils.custom_exception_handler import UserCreationFailedException, \
    TenantDoesNotExistsException
from api.utils.logger import logger
from api.utils.models import ESignStatus
from api.utils.responses import ResponseBuilder


class TenantCreateView(ModelViewSet):
    serializer_class = TenantCreateSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=TenantUserCreateSerializer)
    def create(self, request, *args, **kwargs):
        logger.info('creating a tenant')
        serializer = TenantUserCreateSerializer(data=request.data)

        if serializer.is_valid():
            user_name = serializer.validated_data.pop("user_name")
            user_email = serializer.validated_data.pop("user_email")

            # Create the Tenant instance
            tenant = Tenant.objects.create(**serializer.validated_data)

            # Call the seeder method to populate the roles and features
            all_features = self.seeder(tenant=tenant)

            # Create the User instance
            user = User.objects.create(
                name=user_name, email=user_email, tenant_id=tenant, is_monetizely_user=True)
            response_code, cognito_user = AwsUserManagement().add_user(username=user.email)
            if not response_code == status.HTTP_200_OK:
                raise UserCreationFailedException("User creation failed in Cognito")

            # Get the Implementation Analyst role from all_features
            implementation_analyst_role = all_features.get("Implementation Analyst")

            # Create a mapping for the newly created user, Implementation Analyst role, and the tenant
            UserRoleMapping.objects.create(
                user_id=user, user_role_id=implementation_analyst_role["role_id"])

            return ResponseBuilder.success(
                message="Tenant created successfully",
                data=serializer.validated_data,
                status_code=status.HTTP_201_CREATED,
            )

        return ResponseBuilder.errors(
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    @transaction.atomic
    def seeder(tenant):
        all_features = {
            "Implementation Analyst": [
                {"name": "Users", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Account", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Opportunity", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Sync to Salesforce", "method": ["GET", "POST", "PUT"]},
                {"name": "Organizational Hierarchy", "method": ["GET", "POST", "PUT"]},
                {"name": "Price Book", "method": ["GET", "PUT", "POST", "DELETE"]},
                {"name": "Deal Hub", "method": ["GET", "PUT"]},
                {"name": "Price Book Rule", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Price Book Discount", "method": ["GET", "POST", "PUT"]},
                {"name": "Quote Approval", "method": ["PUT"]},
                {"name": "Template Management", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Product", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Feature Repository", "method": ["GET", "POST"]},
                {"name": "Feature", "method": ["GET", "PUT", "PATCH", "DELETE"]},
                {"name": "Feature Group", "method": ["PATCH", "PUT", "DELETE"]},
                {"name": "Plan", "method": ["GET", "POST", "PATCH", "DELETE"]},
                {"name": "Package", "method": ["GET", "POST", "PUT"]},
                {"name": "Pricing Model", "method": ["GET", "POST", "PUT"]},
                {"name": "Pricing Calculator", "method": ["GET", "POST", "PUT"]},
                {"name": "Deal Terms", "method": ["GET", "PUT"]}
            ],
            "Deal Desk": [
                {"name": "Price Book", "method": ["GET", "PUT", "POST", "DELETE"]},
                {"name": "Deal Hub", "method": ["GET", "PUT"]},
                {"name": "Price Book Rule", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Pricing Calculator", "method": ["GET", "PUT"]},
                {"name": "Price Book Discount", "method": ["GET", "POST", "PUT"]},
                {"name": "Quote Approval", "method": ["PUT"]},
                {"name": "Template Management", "method": ["GET", "POST", "PUT", "DELETE"]}
            ],
            "Product Owner": [
                {"name": "Product", "method": ["GET", "POST", "PUT", "DELETE"]},
                {"name": "Feature Repository", "method": ["GET", "POST"]},
                {"name": "Feature", "method": ["GET", "PUT", "PATCH", "DELETE"]},
                {"name": "Feature Group", "method": ["PATCH", "PUT", "DELETE"]},
                {"name": "Plan", "method": ["GET", "POST", "PATCH", "DELETE"]},
                {"name": "Package", "method": ["GET", "POST", "PUT"]},
                {"name": "Pricing Model", "method": ["GET", "POST", "PUT"]},
            ],
            "Quote Approval": [{"name": "Quote Approval", "method": ["PUT"]}],
            "AE": [{"name": "Pricing Calculator", "method": ["GET", "POST", "PUT"]}],
        }

        # Get all existing FeatureList instances from the database
        existing_feature_lists = {
            (feature.name, feature.method): feature
            for feature in FeatureList.objects.all()
        }
        all_features_with_roles = {}

        for role, features in all_features.items():
            # Get or create the UserRole outside the loop to reduce database calls
            user_role, created = UserRole.objects.get_or_create(
                name=role, description=role, tenant_id=tenant
            )

            role_feature_mappings = []
            for feature in features:
                name = feature["name"]
                methods = feature["method"]
                for method in methods:
                    # Retrieve the existing FeatureList instance from the dictionary
                    feature_list = existing_feature_lists.get((name, method))

                    if not feature_list:
                        # If the FeatureList instance does not exist, you may raise an error or handle it accordingly
                        raise ValueError(
                            f"FeatureList '{name}' with method '{method}' does not exist in the database."
                        )

                    role_feature_mappings.append(
                        RoleFeatureMapping(
                            user_role_id=user_role, feature_list_id=feature_list
                        )
                    )

            RoleFeatureMapping.objects.bulk_create(role_feature_mappings)

            all_features_with_roles[role] = {"role_id": user_role, "features": features}

        return all_features_with_roles

    def list(self, request, *args, **kwargs):
        logger.info('listing all the available tenants')
        queryset = Tenant.objects.filter(is_deleted=False)
        serializer = TenantSerializer(queryset, many=True)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_200_OK
        )


class TenantView(GenericAPIView):
    serializer_class = TenantSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request, id):
        queryset = Tenant.objects.filter(id=id, is_deleted=False).first()
        if not queryset:
            logger.error(f'tenant not found for given id - {id}')
            raise TenantDoesNotExistsException("Tenant not found")
        serializer = TenantSerializer(queryset)
        return ResponseBuilder.success(
            message="Fetched Tenant",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def patch(request, id):
        logger.info(f'updating tenant for given id - {id}')
        result = Tenant.objects.get(id=id, is_deleted=False)
        serializer = TenantCreateSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(data=serializer.data)
        else:
            return ResponseBuilder.errors(data=serializer.errors)

    @staticmethod
    def delete(request, id):
        logger.info(f'deleting tenant for given id - {id}')
        result = Tenant.objects.get(id=id)
        result.is_deleted = True
        result.save()
        return ResponseBuilder.success(message="Tenant Deleted Successfully")


class TenantUsageMonitor(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    http_method_names = ["get"]

    def list(self, request, *args, **kwargs):
        logger.info('listing all the tenant and their user details')
        # Fetch all users from AWS Cognito
        cognito_emails = AwsUserManagement().get_cognito_emails_for_tenant()

        tenants = Tenant.objects.all()
        final_response = []
        for tenant in tenants:
            # Retrieve emails of users from the database for the specific tenant and within the date range
            database_emails = User.objects.filter(
                tenant_id=tenant.id, is_deleted=False
            ).values_list("email", flat=True)

            # Find the matching emails between Cognito and the database for the specific tenant
            matching_emails = set(cognito_emails) & set(database_emails)

            # Get the count of matching emails (logins) for the specified tenant
            logins_count = len(matching_emails)

            # Fetch other data from the database for the specific tenant and within the date range
            models = {
                "product": Product,
                "plan": Plan,
                "pricing_model": PricingModel,
                "quote": Quote,
                "contract": Contract,
            }

            model_counts = defaultdict(int)
            for model_name, model_class in models.items():
                model_counts[model_name] = model_class.objects.filter(
                    tenant_id=tenant.id, is_deleted=False
                ).count()

            # Get the count of signed contracts for the specified tenant and within the date range
            signed_contract_count = Contract.objects.filter(
                tenant_id=tenant.id, status=ESignStatus.Activated.value, is_deleted=False
            ).count()

            response_data = {
                "id": tenant.id,
                "name": tenant.name,
                **model_counts,
                "signed_contract": signed_contract_count,
                "users": len(database_emails),
                "logins": logins_count,
            }
            final_response.append(response_data)

        return ResponseBuilder.success(
            data=final_response, status_code=status.HTTP_200_OK
        )
