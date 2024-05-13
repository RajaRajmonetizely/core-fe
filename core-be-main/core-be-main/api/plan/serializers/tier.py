from rest_framework import serializers

from api.plan.models import Tier


class TierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tier
        fields = "__all__"


class TierCreateSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField(required=True)
    tier_names = serializers.ListField(child=serializers.CharField(), required=True)


class TierUpdateSerializer(serializers.Serializer):
    name = serializers.CharField()
    tier_id = serializers.UUIDField()


class TierDeleteSerializer(serializers.Serializer):
    tier_id = serializers.UUIDField(required=True)
