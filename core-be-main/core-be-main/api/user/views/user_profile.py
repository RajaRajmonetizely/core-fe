from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.user.models import UserSettings, UserRoleMapping
from api.user.serializers import UserSettingSerializer
from api.user.utils import get_user_obj_from_email
from api.utils.responses import ResponseBuilder


class UserProfileView(APIView):
    serializer_class = UserSettingSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request):
        user_obj = get_user_obj_from_email(request.user[0])
        response = {
            'user_id': user_obj.id, 'name': user_obj.name, 'email': user_obj.email,
            'manager_name': user_obj.manager_id.name if user_obj.manager_id else None,
            'tenant': user_obj.tenant_id.name if user_obj.tenant_id else None,
            'date_format': user_obj.tenant_id.date_format if user_obj.tenant_id else None,
            'org_hierarchy': user_obj.org_hierarchy_id.name if user_obj.org_hierarchy_id else None,
            'is_staff_access': False
        }
        user_setting_obj = UserSettings.objects.filter(
            user_id=user_obj.id, is_deleted=False).first()
        if user_setting_obj:
            response['is_staff_access'] = user_setting_obj.value

        user_role_map = UserRoleMapping.objects.filter(user_id=user_obj.id, is_deleted=False)
        response['roles'] = [user_role.user_role_id.name for user_role in user_role_map]

        return ResponseBuilder.success(
            data=response,
            status_code=status.HTTP_200_OK,
        )
