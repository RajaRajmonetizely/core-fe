import os
from pathlib import Path

from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.pricing_calculator.constants import SENDER, FROM_STR
from api.user.models import UserSettings, UserRole, UserRoleMapping
from api.user.serializers import UserSettingSerializer
from api.user.utils import get_user_obj_from_email
from api.utils.custom_exception_handler import UserRoleDoesNotExistsException, \
    RootAdminDoesNotExistsException
from api.utils.notifications.send_notification import Notifications
from api.utils.responses import ResponseBuilder


class UserSettingView(APIView):
    serializer_class = UserSettingSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=UserSettingSerializer)
    def post(self, request):
        payload = request.data
        user_obj = get_user_obj_from_email(request.user[0])
        user_setting_obj = UserSettings.objects.filter(
            user_id=user_obj.id, name=payload.get('name'), is_deleted=False)
        if user_setting_obj:
            user_setting_obj[0].value = payload.get('value')
            user_setting_obj[0].save()
        else:
            # Get root admin email address
            root_admin_role_obj = UserRole.objects.filter(
                name='Root admin', is_deleted=False).first()
            if not root_admin_role_obj:
                raise UserRoleDoesNotExistsException("Root Admin Role Does Not Exist")

            user_role_map_obj = UserRoleMapping.objects.filter(
                user_role_id=root_admin_role_obj.id, is_deleted=False).first()
            if not user_role_map_obj:
                raise RootAdminDoesNotExistsException("No Root Admin user is found")

            _ = UserSettings.objects.create(
                user_id=user_obj, name=payload.get('name'), value=payload.get('value')
            )
            payload = {
                'sender': SENDER,
                'cc_addr': [],
                'from_str': FROM_STR,
                'data': {'user_name': user_obj.name, 'admin': user_role_map_obj.user_id.name,
                         'tenant': user_obj.tenant_id.name},
                'to_addr': [user_role_map_obj.user_id.email],
                'subject': 'Staff Access Enabled for {} in {} Tenant'.format(
                    user_obj.name, user_obj.tenant_id.name)
            }
            # Send email notification using Notifications class
            template_path = os.path.join(os.path.abspath(Path(__file__).parent.parent),
                                         'templates')
            Notifications(
                template_path, 'staff_access.html', payload).send_email_notification()
        return ResponseBuilder.success(
            message="User Setting updated successfully",
            status_code=status.HTTP_200_OK,
        )
