from rest_framework import serializers

from api.user.models import UserRole


class RbacSerializer(serializers.Serializer):
    class Meta:
        model = UserRole
        fields = ["id", "name"]
