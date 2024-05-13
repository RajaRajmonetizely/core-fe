from rest_framework import serializers

from api.pricing_calculator.models import Quote


class RowValuesSerializer(serializers.Serializer):
    key = serializers.CharField(required=True)
    value = serializers.CharField(required=True)


class RowDetailsSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    driving_field = serializers.CharField()
    values = RowValuesSerializer(many=True)


class QuoteProductSerializer(serializers.Serializer):
    rows = RowDetailsSerializer(many=True)


class QuoteDetailSerializer(serializers.Serializer):
    core = QuoteProductSerializer()
    addons = QuoteProductSerializer()


class QuoteTotalSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    key = serializers.CharField(required=True)


class TierWiseSerializer(serializers.Serializer):
    tier_id = serializers.UUIDField(required=True)
    total = QuoteTotalSerializer(many=True)
    details = QuoteDetailSerializer()


class QuoteDetailsSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(required=True)
    tiers = TierWiseSerializer(many=True)


class CreateQuoteColumnSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    key = serializers.CharField(required=True)


class CreateQuoteSerializer(serializers.Serializer):
    opportunity_id = serializers.UUIDField(required=True)
    price_book_id = serializers.UUIDField(required=True)
    total_price = serializers.IntegerField(required=True)
    quote_number = serializers.CharField(required=False)
    quote_url = serializers.CharField(required=False)
    discount = serializers.DecimalField(required=True, decimal_places=2, max_digits=5)
    name = serializers.CharField(required=True)
    columns = CreateQuoteColumnSerializer(many=True)
    quote_details = QuoteDetailsSerializer(many=True)
    deal_term_details = serializers.JSONField()


class PricingCalcSerializer(serializers.Serializer):
    class Meta:
        model = Quote
        fields = ["id", "name"]


class QuoteCommentSerializer(serializers.Serializer):
    class Meta:
        model = Quote
        fields = ["id", "comment"]


class CreateQuoteCommentSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True)


class ProductDiscount(serializers.Serializer):
    product_id = serializers.UUIDField()
    discount = serializers.CharField()


class QuoteApprovalSerializer(serializers.Serializer):
    status = serializers.CharField(required=True)
    details = ProductDiscount(many=True)


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = "__all__"
