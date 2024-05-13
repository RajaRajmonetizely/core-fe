from rest_framework import serializers

from api.plan.models import Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class PlanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ["id", "name", "feature_repository_id", "tenant_id"]


class PlanUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ["name"]
