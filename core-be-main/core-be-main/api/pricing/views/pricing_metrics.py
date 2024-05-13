from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.pricing.models import PricingMetric
from api.pricing.serializers.metric import PricingMetricSerializer
from api.user.utils import get_tenant_id_from_email
from api.utils.responses import ResponseBuilder


class PricingMetricView(GenericAPIView):
    serializer_class = PricingMetricSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        result_set = PricingMetric.objects.filter(is_deleted=False, tenant_id=tenant_id)
        user_metrics = PricingMetricSerializer(result_set, many=True).data
        all_user_metrics = [
            {"name": metric["name"], "id": metric["id"]} for metric in user_metrics
        ]
        return ResponseBuilder.success(
            data=all_user_metrics, status_code=status.HTTP_200_OK
        )

    @staticmethod
    def post(request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        request.data.update({"tenant_id": tenant_id})
        serializer = PricingMetricSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(
                data=serializer.data, status_code=status.HTTP_201_CREATED
            )

        return ResponseBuilder.errors(
            message=serializer.error_messages, status_code=status.HTTP_400_BAD_REQUEST
        )
