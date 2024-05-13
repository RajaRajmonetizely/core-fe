from rest_framework import serializers
import json

from api.pricing.models import PricingModelDetails


class PricingModelCoreColumn(serializers.Serializer):
    name = serializers.CharField(required=True)
    sub_columns = serializers.ListField(
        child=serializers.DictField(required=False), allow_null=True
    )
    key = serializers.CharField(required=True)
    is_input_column = serializers.BooleanField(required=True)
    is_output_column = serializers.BooleanField(required=True)
    metric_id = serializers.CharField(required=False, allow_null=True)
    has_formula = serializers.BooleanField()
    formula = serializers.CharField()


class AddonColumn(serializers.Serializer):
    name = serializers.CharField()
    sub_columns = serializers.ListField(
        child=serializers.DictField(required=False), allow_null=True
    )
    key = serializers.CharField()
    is_input_column = serializers.BooleanField()
    is_output_column = serializers.BooleanField()
    metric_id = serializers.CharField(required=False, allow_null=True)
    has_formula = serializers.BooleanField()
    formula = serializers.CharField()


class PricingModelCoreSerilaizer(serializers.Serializer):
    columns = PricingModelCoreColumn(many=True)
    values = serializers.ListField()


class AddonSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    is_custom_metric = serializers.BooleanField()
    details = serializers.DictField()
    metric_name = serializers.CharField()
    columns = AddonColumn(many=True)
    values = serializers.ListField()
    metric_details = serializers.ListField(
        required=False, child=serializers.UUIDField(required=False)
    )
    pricing_structure_id = serializers.UUIDField(required=False)


class PricingModelDetailSerilaizer(serializers.Serializer):
    pricing_model_detail_id = serializers.UUIDField(required=True)
    core = PricingModelCoreSerilaizer(many=False)
    addons = AddonSerializer(many=False)


class PricingModelUpdateSerializer(serializers.Serializer):
    metric_details = serializers.ListField(
        required=True, child=serializers.UUIDField(required=True)
    )
    pricing_structure_id = serializers.UUIDField(required=False)
    details = PricingModelDetailSerilaizer(many=True)


class AddonMetricSerializer(serializers.Serializer):
    addon_id = serializers.UUIDField(required=True)
    tier_id = serializers.UUIDField(required=True)
    name = serializers.CharField(required=True)


class PricingModelDetailsSerilaizer(serializers.Serializer):
    details = serializers.JSONField()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["details"] = json.loads(representation["details"])
        return representation

class QuoteAddonConfig(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    input_payload = serializers.DictField(required=True)
    addon_output_keys = serializers.DictField(required=False)


class QuoteQuantitySerializer(serializers.Serializer):
    addons = QuoteAddonConfig(many=True)
    output_keys = serializers.DictField(required=True)
    input_payload = serializers.DictField(required=True)
