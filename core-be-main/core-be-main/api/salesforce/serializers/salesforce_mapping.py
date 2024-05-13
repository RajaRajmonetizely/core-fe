from rest_framework import serializers

from api.salesforce.models import SalesforceMappingModel


class SalesforceMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesforceMappingModel
        fields = "__all__"  # Include all fields by default


class SalesforceMappingCreateSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    sf_column_mapping = serializers.JSONField()
    m_column_mapping = serializers.JSONField()
    config = serializers.JSONField()
