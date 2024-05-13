import json
import os

from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.salesforce.serializers.salesforce_connector import (
    SalesforceConnectorCreateSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email
from api.utils.aws_utils.secrets import AwsSecret
from api.utils.responses import ResponseBuilder


class SFConnector(GenericAPIView):
    """Salesforce Connector Config"""

    authentication_classes = [CognitoAuthentication]
    serializer_class = SalesforceConnectorCreateSerializer

    secret_id = os.getenv("SALESFORCE_CONFIG_SECRET_ID")

    def get(self, request):
        tenant_id = str(get_tenant_id_from_email(request.user[0]))
        config = AwsSecret.get(secret_id=SFConnector.secret_id)
        return ResponseBuilder.success(
            data=config[tenant_id] if config.get(tenant_id) else {},
            status_code=status.HTTP_200_OK,
        )

    @swagger_auto_schema(request_body=SalesforceConnectorCreateSerializer)
    def post(self, request):
        try:
            payload = request.data
            tenant_id = get_tenant_id_from_email(request.user[0])
            config = AwsSecret.get(secret_id=SFConnector.secret_id)
            config.update({str(tenant_id): payload})
            AwsSecret.update(secret_id=SFConnector.secret_id, config=json.dumps(config))
            return ResponseBuilder.success(
                data="Credentials updated successfully",
                status_code=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return ResponseBuilder.errors(
                message="Issue while updating secret",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
