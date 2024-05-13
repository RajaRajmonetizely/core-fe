from rest_framework import serializers

from api.document.models import ContractTemplate


class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractTemplate
        fields = ["id", "name", "s3_doc_file_path", "description", "s3_pdf_file_path"]


class ContractTemplateCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=False, max_length=255)
