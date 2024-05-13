from rest_framework import serializers

from api.user.models import OrgHierarchy


class OrgHierarchySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgHierarchy
        fields = "__all__"


class OrgHierarchyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgHierarchy
        fields = ["parent_id", "name", "description", "tenant_id"]


class OrgHierarchyStructureSerializer(serializers.Serializer):
    parent_id = serializers.CharField(allow_null=True)
    org_hierarchy = serializers.ListField(child=serializers.DictField())


class OrgHierarchyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgHierarchy
        fields = fields = ["parent_id", "name", "description"]
