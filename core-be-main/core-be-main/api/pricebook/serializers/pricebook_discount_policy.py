from rest_framework import serializers

from api.pricebook.models import PriceBookDiscountPolicy


class PriceBookDiscountPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceBookDiscountPolicy
        fields = "__all__"
