from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.tenant.serializers import TenantSerializer
from api.user.models import UserSettings, User
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class TenantUserView(APIView):
    serializer_class = TenantSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request, id):
        logger.info(f'get all the users for given tenant id - {id}')
        users = User.objects.filter(tenant_id=id, is_deleted=False)
        response = []
        for user_obj in users:
            data = {
                'user_id': user_obj.id, 'name': user_obj.name, 'email': user_obj.email,
                'manager_name': user_obj.manager_id.name if user_obj.manager_id else None,
                'tenant': user_obj.tenant_id.name if user_obj.tenant_id else None,
                'org_hierarchy': user_obj.org_hierarchy_id.name
                if user_obj.org_hierarchy_id else None,
                'is_staff_access': False
            }
            user_setting_obj = UserSettings.objects.filter(
                user_id=user_obj.id, is_deleted=False).first()
            if user_setting_obj:
                data['is_staff_access'] = user_setting_obj.value
            response.append(data)

        return ResponseBuilder.success(
            data=response,
            status_code=status.HTTP_200_OK,
        )
