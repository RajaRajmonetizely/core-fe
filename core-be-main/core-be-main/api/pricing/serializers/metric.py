from rest_framework import serializers

from api.pricing.models import PricingMetric


class PricingMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingMetric
        fields = "__all__"
