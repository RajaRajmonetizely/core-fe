import json

from django.db import transaction
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.tenant.models import TenantConfig, Tenant
from api.tenant.serializers import TenantDealTermSerializer
from api.user.utils import get_tenant_id_from_email
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class TenantDealTermsView(APIView):
    serializer_class = TenantDealTermSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=TenantDealTermSerializer(many=True))
    @transaction.atomic
    def put(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant_config = TenantConfig.objects.filter(tenant_id=tenant_id, is_deleted=False).first()
        request_payload = request.data
        logger.info(f'{request_payload = }')
        if tenant_config:
            tenant_config.config = json.dumps(request_payload)
            tenant_config.save()
        else:
            tenant_obj = Tenant.objects.filter(id=tenant_id, is_deleted=False).first()
            TenantConfig.objects.create(
                config=json.dumps(request_payload), tenant_id=tenant_obj)
        return ResponseBuilder.success(
            data=request_payload,
            message="Tenant configuration updated successfully.",
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def get(request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant_specific_config \
            = TenantConfig.objects.filter(tenant_id=tenant_id, is_deleted=False).first()
        response = json.loads(tenant_specific_config.config) \
            if tenant_specific_config else []

        tenant_config = TenantConfig.objects.filter(is_deleted=False, tenant_id=None).first()

        if response:
            for config in json.loads(tenant_config.config):
                found = False
                for item in response:
                    if config.get('name') == item.get('name'):
                        found = True
                if not found:
                    response.append(config)
        else:
            response = json.loads(tenant_config.config)
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)
