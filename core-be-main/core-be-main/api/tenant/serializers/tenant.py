from rest_framework import serializers

from api.tenant.models import Tenant, TenantConfig
from api.user.models import User


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = "__all__"


class TenantCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    address = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    postal_code = serializers.CharField()
    country = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Tenant
        fields = "__all__"


class TenantUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    address = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    postal_code = serializers.CharField()
    country = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    user_name = serializers.CharField()
    user_email = serializers.EmailField()
    date_format = serializers.CharField(required=False)


class TenantConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantConfig
        fields = "__all__"


class TenantDealTermSerializer(serializers.Serializer):
    name = serializers.CharField()
    label = serializers.CharField()
    component = serializers.CharField()
    options = serializers.ListField(child=serializers.DictField())
    isSearchable = serializers.BooleanField()
    isClearable = serializers.BooleanField()
    initialValue = serializers.CharField()
    FormFieldGridProps = serializers.DictField()
