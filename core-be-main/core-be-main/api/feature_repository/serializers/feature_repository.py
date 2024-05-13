from rest_framework import serializers

from api.feature_repository.models import FeatureRepository


class RepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureRepository
        fields = "__all__"


class RepositoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureRepository
        fields = ["name", "product_id"]
