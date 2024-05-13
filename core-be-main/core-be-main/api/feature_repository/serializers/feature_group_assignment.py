from rest_framework import serializers


class FeatureAssignmentSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    name = serializers.CharField(required=False)


class FeatureGroupAssignmentSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    name = serializers.CharField(required=False)
    is_independent = serializers.BooleanField()
    features = FeatureAssignmentSerializer(many=True)


class FeatureAssignmentDataSerializer(serializers.Serializer):
    feature_groups = FeatureGroupAssignmentSerializer(many=True)
    features = FeatureAssignmentSerializer(many=True)
