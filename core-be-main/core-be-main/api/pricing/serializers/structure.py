import json

from rest_framework import serializers

from api.pricing.models import PricingModel, PricingStructure


class PricingStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingStructure
        fields = "__all__"

    def create(self, validated_data):
        pricing_model_id = validated_data.pop("pricing_model_id")
        details = validated_data.pop("details")
        query_set = PricingModel.objects.get(id=pricing_model_id)
        pricing_structure = PricingStructure.objects.create(
            pricing_model_id=query_set,
            details=json.dumps(details),
            **dict(validated_data)
        )
        return pricing_structure


class PricingStructureDetailsSerializer(serializers.Serializer):
    name = serializers.CharField()
    sub_labels = serializers.ListField(allow_null=True)
    key = serializers.CharField()
    is_input_column = serializers.BooleanField()
    is_output_column = serializers.BooleanField()
    is_metric_column = serializers.BooleanField()
    metric_id = serializers.UUIDField(allow_null=True)
    has_formula = serializers.BooleanField()
    formula = serializers.CharField(allow_null=True)


class CreatePricingStructureSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    pricing_model_id = serializers.UUIDField(required=False)
    details = PricingStructureDetailsSerializer(many=True)
