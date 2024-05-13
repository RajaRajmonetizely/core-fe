from rest_framework import serializers

from api.user.models import UserRole


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = "__all__"


class UserRoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ["name", "description", "tenant_id"]
