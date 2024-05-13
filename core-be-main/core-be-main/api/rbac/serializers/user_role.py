from rest_framework import serializers


class UserRoleAssignmentSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
    list_of_roles = serializers.ListField(child=serializers.UUIDField(required=True))
