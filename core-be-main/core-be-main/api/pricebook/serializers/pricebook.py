from rest_framework import serializers, viewsets

from api.pricebook.models import PriceBook, PriceBookEntry


class PriceBookEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceBookEntry
        fields = "__all__"


class PriceBookSerializer(serializers.ModelSerializer):
    pricebook_entries = PriceBookEntrySerializer(many=True, read_only=True)

    class Meta:
        model = PriceBook
        fields = ["id", "name", "pricebook_entries", "tenant_id"]
