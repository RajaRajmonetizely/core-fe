from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "tenant_id"]


class ProductCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)

    class Meta:
        model = Product
        fields = ["id", "name", "description"]
