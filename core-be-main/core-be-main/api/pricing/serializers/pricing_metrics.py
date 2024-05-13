from rest_framework import serializers

from api.pricing.models import PricingMetric


class PricingMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingMetric
        fields = ["id", "name"]


class PricingMetricCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingMetric
        fields = ["name"]
