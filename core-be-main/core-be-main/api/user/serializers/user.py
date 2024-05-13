from rest_framework import serializers

from api.user.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class UserCreateSerializer(serializers.ModelSerializer):
    user_roles = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )

    class Meta:
        model = User
        exclude = ["id", "created_on", "updated_on", "is_deleted"]


class UserCreateCSVSerializer(serializers.Serializer):
    user_list = serializers.ListField(child=serializers.DictField())


class UserSettingSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    value = serializers.BooleanField(required=True)
