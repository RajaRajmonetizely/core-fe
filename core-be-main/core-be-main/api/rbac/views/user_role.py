from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.rbac.serializers.user_role import UserRoleAssignmentSerializer
from api.user.models import User, UserRole, UserRoleMapping
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import UserDoesNotExistsException, \
    UserRoleDoesNotExistsException
from api.utils.responses import ResponseBuilder


class RbacUserRoleView(APIView):
    serializer_class = UserRoleAssignmentSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=UserRoleAssignmentSerializer())
    def post(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        user_obj = User.objects.filter(
            id=request.data.get('user_id'), is_deleted=False, tenant_id=tenant_id).first()
        if not user_obj:
            raise UserDoesNotExistsException('User does not exists')
        list_of_roles = list(set(request.data.get('list_of_roles', [])))

        queryset = UserRoleMapping.objects.filter(
            user_id=user_obj.id, user_role_id__in=list_of_roles,
            is_deleted=False).values_list('user_role_id', flat=True)
        existing_roles = [str(item) for item in queryset]
        new_roles = list(set(list_of_roles) - set(existing_roles))
        new_roles_to_be_added = []

        # Root Admin role
        root_user_role_obj = UserRole.objects.filter(name='Root admin', is_deleted=False).first()
        if not root_user_role_obj:
            raise UserRoleDoesNotExistsException("Root Admin User Role Does Not Exists")

        for role_id in new_roles:
            if role_id == str(root_user_role_obj.id):
                tenant_id = None
            user_role_obj = UserRole.objects.filter(
                id=role_id,
                is_deleted=False, tenant_id=tenant_id).first()
            if not user_role_obj:
                raise UserRoleDoesNotExistsException("User Role Does Not Exist")

            new_roles_to_be_added.append(
                UserRoleMapping(user_role_id=user_role_obj, user_id=user_obj))
        if new_roles_to_be_added:
            UserRoleMapping.objects.bulk_create(new_roles_to_be_added)
        return ResponseBuilder.success(
            data="Role updated successfully", status_code=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(request_body=UserRoleAssignmentSerializer())
    def put(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        user_obj = User.objects.filter(
            id=request.data.get('user_id'), is_deleted=False, tenant_id=tenant_id).first()
        if not user_obj:
            raise UserDoesNotExistsException('User does not exists')
        list_of_roles = list(set(request.data.get('list_of_roles', [])))
        _ = UserRoleMapping.objects.filter(
            user_id=user_obj.id, user_role_id__in=list_of_roles,
            is_deleted=False).update(is_deleted=True)
        return ResponseBuilder.success(
            data="Role updated successfully", status_code=status.HTTP_201_CREATED
        )
