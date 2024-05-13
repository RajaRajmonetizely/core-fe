from rest_framework import serializers

from api.feature_repository.models import Feature


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = "__all__"


class FeatureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = [
            "name",
            "external_name",
            "external_description",
            "sort_order",
            "feature_repository_id",
            "feature_group_id",
        ]


class FeatureOrderSerializer(serializers.Serializer):
    feature_id = serializers.UUIDField(required=True)
    sort_order = serializers.IntegerField(required=True)


class FeatureUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    external_name = serializers.CharField(required=False)
    external_description = serializers.CharField(required=False)

    class Meta:
        model = Feature
        fields = ["name", "external_name", "external_description"]
