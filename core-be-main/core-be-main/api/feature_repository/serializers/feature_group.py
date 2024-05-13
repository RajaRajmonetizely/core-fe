from rest_framework import serializers

from api.feature_repository.models import FeatureGroup


class FeatureGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureGroup
        fields = "__all__"


class FeatureGroupCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    external_name = serializers.CharField(required=False)
    external_description = serializers.CharField(required=False)
    sort_order = serializers.IntegerField(required=True)

    class Meta:
        model = FeatureGroup
        fields = ["id", "name", "external_name", "external_description", "sort_order"]


class FeatureGroupUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    external_name = serializers.CharField(required=False)
    external_description = serializers.CharField(required=False)

    class Meta:
        model = FeatureGroup
        fields = ["id", "name", "external_name", "external_description"]


class FeatureGroupOrderSerializer(serializers.Serializer):
    feature_group_id = serializers.UUIDField()
    sort_order = serializers.IntegerField()
