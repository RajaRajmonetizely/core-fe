from rest_framework import serializers

from api.rbac.models import FeatureList


class FeaturesSerializer(serializers.Serializer):
    class Meta:
        model = FeatureList
        fields = ["id", "name"]


class CreateFeaturesSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    method = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(max_length=100, required=False)


class FeatureRoleMapView(serializers.Serializer):
    user_role_id = serializers.UUIDField(required=True)
    feature_list_id = serializers.UUIDField(required=True)


class FeatureUserMapView(serializers.Serializer):
    feature_list_id = serializers.UUIDField(required=False)


class FeatureRoleAssignmentView(serializers.Serializer):
    role_feature_map = FeatureRoleMapView()
    user_feature_map = FeatureUserMapView()

