from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.rbac.models import FeatureList, RoleFeatureMapping, UserFeature
from api.rbac.serializers.features import FeaturesSerializer, CreateFeaturesSerializer, \
    FeatureRoleAssignmentView
from api.user.models import User, UserRole
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import FeatureDoesNotExistsException, \
    FeatureAlreadyAssignedException, UserRoleDoesNotExistsException
from api.utils.responses import ResponseBuilder


class FeaturesView(APIView):
    serializer_class = FeaturesSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=CreateFeaturesSerializer, manual_parameters=[
        openapi.Parameter(
            "id",
            openapi.IN_QUERY,
            description="Role to be updated",
            type=openapi.TYPE_STRING,
            format=openapi.TYPE_STRING,
            required=False,
        ),
    ], )
    def post(self, request):
        existing_feature_id = request.query_params.get("id")
        if existing_feature_id:
            feature_list_obj = FeatureList.objects.filter(
                id=existing_feature_id, is_deleted=False).first()
            if not feature_list_obj:
                raise FeatureDoesNotExistsException("Feature Does Not Exist")

            if request.data["name"]:
                feature_list_obj.name = request.data["name"]
            if request.data["method"]:
                feature_list_obj.description = request.data["method"]
            if request.data["description"]:
                feature_list_obj.description = request.data["description"]
            feature_list_obj.save()
            return ResponseBuilder.success(
                data={"id": feature_list_obj.id, "name": feature_list_obj.name,
                      "method": feature_list_obj.method,
                      "description": feature_list_obj.description},
                status_code=status.HTTP_201_CREATED,
            )
        feature_list_obj = FeatureList.objects.create(
            name=request.data["name"],
            method=request.data["method"],
            description=request.data["description"]
        )
        return ResponseBuilder.success(
            data={"id": feature_list_obj.id,
                  "name": feature_list_obj.name, "method": feature_list_obj.method,
                  "description": feature_list_obj.description},
            status_code=status.HTTP_201_CREATED,
        )

    @staticmethod
    def get(request):
        feature_role_obj = FeatureList.objects.filter(is_deleted=False)
        data = [{'id': item.id, 'name': item.name, 'method': item.method,
                 'description': item.description}
                for item in feature_role_obj]
        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    @swagger_auto_schema(request_body=FeatureRoleAssignmentView)
    def put(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])

        role_feature_map_data = request.data.get('role_feature_map')
        if role_feature_map_data:
            role_feature_mapping_obj = RoleFeatureMapping.objects.filter(
                user_role_id=role_feature_map_data.get('user_role_id'),
                feature_list_id=role_feature_map_data.get('feature_list_id'),
                is_deleted=False).first()
            if role_feature_mapping_obj:
                raise FeatureAlreadyAssignedException("Feature is already assigned to the Role")

            user_role_obj = UserRole.objects.filter(
                id=role_feature_map_data.get('user_role_id'),
                is_deleted=False, tenant_id=tenant_id).first()
            if not user_role_obj:
                raise UserRoleDoesNotExistsException("User Role Does Not Exist")

            feature_role_obj = FeatureList.objects.filter(
                id=role_feature_map_data.get('feature_list_id'), is_deleted=False).first()
            if not feature_role_obj:
                raise FeatureDoesNotExistsException("Feature Does Not Exist")

            role_feature_mapping_obj = RoleFeatureMapping.objects.create(
                user_role_id=user_role_obj, feature_list_id=feature_role_obj
            )
            return ResponseBuilder.success(
                data={
                    "id": role_feature_mapping_obj.id,
                    "role_id": role_feature_mapping_obj.user_role_id.id,
                    "role_name": role_feature_mapping_obj.user_role_id.name,
                    "feature_list_id": role_feature_mapping_obj.feature_list_id.id,
                    "feature_name": role_feature_mapping_obj.feature_list_id.name
                },
                status_code=status.HTTP_201_CREATED,
            )

        user_feature_map_data = request.data.get('user_feature_map')
        if user_feature_map_data:
            user_obj = User.objects.get(email=request.user[0], is_deleted=False)

            feature_list_obj = FeatureList.objects.filter(
                id=user_feature_map_data.get('feature_list_id'), is_deleted=False).first()
            if not feature_list_obj:
                raise FeatureDoesNotExistsException("Feature Does Not Exist")

            user_feature_mapping_obj = UserFeature.objects.filter(
                user_id=user_obj.id,
                feature_list_id=user_feature_map_data.get('feature_list_id'),
                is_deleted=False)
            if user_feature_mapping_obj:
                raise FeatureAlreadyAssignedException("Feature is already assigned to the User")

            user_feature_obj = UserFeature.objects.create(
                user_id=user_obj, feature_list_id=feature_list_obj
            )
            return ResponseBuilder.success(
                data={
                    "id": user_feature_obj.id,
                    "user_id": user_feature_obj.user_id.id,
                    "user_name": user_feature_obj.user_id.name,
                    "feature_list_id": user_feature_obj.feature_list_id.id,
                    "feature_name": user_feature_obj.feature_list_id.name
                },
                status_code=status.HTTP_201_CREATED,
            )
