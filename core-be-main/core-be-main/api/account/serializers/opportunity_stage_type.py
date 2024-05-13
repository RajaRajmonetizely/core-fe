from rest_framework import serializers

from api.account.models import OpportunityStage, OpportunityType


class OpportunityStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpportunityStage
        fields = "__all__"


class OpportunityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpportunityType
        fields = "__all__"
