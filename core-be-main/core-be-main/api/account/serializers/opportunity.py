from rest_framework import serializers

from api.account.models import Opportunity


class OpportunitySerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    updated_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Opportunity
        fields = "__all__"
