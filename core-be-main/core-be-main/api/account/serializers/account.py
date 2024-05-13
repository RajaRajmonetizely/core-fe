from rest_framework import serializers

from api.account.models import Account, IndustryType


class AccountSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    updated_by = serializers.PrimaryKeyRelatedField(read_only=True)


    class Meta:
        model = Account
        fields = "__all__"


class AccountCreateSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    updated_by = serializers.PrimaryKeyRelatedField(read_only=True)
    quote_to_name = serializers.CharField(required=True)
    quote_to_address = serializers.CharField(required=True)

    class Meta:
        model = Account
        fields = "__all__"


class IndustryTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndustryType
        fields = "__all__"
