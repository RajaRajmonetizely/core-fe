from rest_framework import serializers

from api.pricebook.models import PriceBookRule


class PriceBookRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceBookRule
        fields = "__all__"
