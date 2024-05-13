from rest_framework import serializers

from .models import Package, PackageDetail


class PackageDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageDetail
        fields = ["id", "package_id", "tier_id", "details"]


class PackageSerializer(serializers.ModelSerializer):
    packagedetail_set = PackageDetailsSerializer(many=True, read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Package
        fields = "__all__"


class FeatureDetails(serializers.Serializer):
    feature_id = serializers.UUIDField(required=False)
    is_addon = serializers.BooleanField(required=False)


class FeatureGroupDetails(serializers.Serializer):
    feature_group_id = serializers.UUIDField(required=False)
    features = FeatureDetails(many=True)


class PackageUpdateSerializer(serializers.Serializer):
    package_detail_id = serializers.UUIDField()
    features = FeatureDetails(many=True)
    feature_groups = FeatureGroupDetails(many=True)
