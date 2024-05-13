from rest_framework import serializers


class SalesforceConnectorCreateSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    client_id = serializers.CharField(required=True)
    client_secret = serializers.CharField(required=True)
    url = serializers.CharField(required=True)
