from rest_framework import serializers

from api.pricing.models import PricingModel


class PricingModelSerializer(serializers.Serializer):
    class Meta:
        model = PricingModel
        fields = ["id", "name"]


class PricingModelCreateSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    package_id = serializers.UUIDField(required=True)

    class Meta:
        model = PricingModel
        fields = ["name", "package_id"]


class IntegerOrDictField(serializers.Field):
    def to_internal_value(self, data):
        if isinstance(data, int):
            return data
        elif isinstance(data, dict):
            return data
        else:
            raise serializers.ValidationError("addon_units must be an integer or a dictionary.")

    def to_representation(self, value):
        return value


class AddonConfig(serializers.Serializer):
    addon_id = serializers.UUIDField(required=True)
    addon_units = IntegerOrDictField(required=True)


class PricingCalculatorSerializer(serializers.Serializer):
    tier_id = serializers.UUIDField(required=True)
    quantity = serializers.DictField(required=True)
    addons = AddonConfig(many=True)


class AddonDetails(serializers.Serializer):
    addon_id = serializers.UUIDField(required=False)
    addon_units = IntegerOrDictField(required=True)


class PricingCurveSerializer(serializers.Serializer):
    tier_id = serializers.UUIDField(required=False)
    addons = AddonDetails(many=True)
