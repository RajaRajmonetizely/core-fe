from rest_framework import serializers

from api.account.models import Account


class AccountSFSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
