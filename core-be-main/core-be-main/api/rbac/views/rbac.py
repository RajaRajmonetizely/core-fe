from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.rbac.models import RoleFeatureMapping, UserFeature
from api.rbac.serializers.rbac import RbacSerializer
from api.user.models import User, UserRoleMapping
from api.utils.responses import ResponseBuilder


class RbacView(APIView):
    serializer_class = RbacSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request):
        user_obj = User.objects.get(email=request.user[0], is_deleted=False)
        user_role_map_obj = UserRoleMapping.objects.filter(user_id=user_obj.id, is_deleted=False)
        user_role_dict = {str(item.user_role_id.id): item.user_role_id.name
                          for item in user_role_map_obj}
        user_role_ids = user_role_dict.keys()
        groups = list(user_role_dict.values())
        role_feature_mapping = RoleFeatureMapping.objects.filter(
            user_role_id__in=user_role_ids, is_deleted=False)
        data = {}
        for item in role_feature_mapping:
            feature_name = item.feature_list_id.name
            if feature_name in data:
                values = data[feature_name]
                values.append(item.feature_list_id.method)
            else:
                data[feature_name] = [item.feature_list_id.method]
        user_features = UserFeature.objects.filter(user_id=user_obj.id, is_deleted=False)
        for item in user_features:
            feature_name = item.feature_list_id.name
            if feature_name in data:
                values = data[feature_name]
                values.append(item.feature_list_id.method)
            else:
                data[feature_name] = [item.feature_list_id.method]
        return ResponseBuilder.success(
            data=data,
            user_id=user_obj.id,
            groups=groups,
            status_code=status.HTTP_200_OK,
        )
