import os

from drf_yasg import openapi
from rest_framework import status, parsers
from rest_framework.viewsets import ModelViewSet
from drf_yasg.utils import swagger_auto_schema

from api.auth.authentication import CognitoAuthentication
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.aws_utils.s3 import S3Service
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder

from .models import ContractTemplate
from .serializer import ContractTemplateCreateSerializer, ContractTemplateSerializer
from ..utils.template.doctopdf import DocxToPdfConverter


class ContractTemplateViewSet(ModelViewSet):
    queryset = ContractTemplate.objects.all()
    serializer_class = ContractTemplateSerializer
    authentication_classes = [CognitoAuthentication]
    parser_classes = [parsers.MultiPartParser]
    http_method_names = ["post", "get", "put", "delete"]

    def list(self, request, *args, **kwargs):
        logger.info("Listing of contract template")
        tenant_id = get_tenant_id_from_email(request.user[0])
        queryset = self.queryset.filter(is_deleted=False, tenant_id=tenant_id)
        serializer = ContractTemplateSerializer(queryset, many=True)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_200_OK
        )

    def handle_file_upload(self, file_data, tenant_id, template_id):
        # Make a temp directory
        temp_dir = "/tmp/doc-to-upload"
        os.makedirs(temp_dir, exist_ok=True)

        local_path = os.path.join(temp_dir, file_data.name)

        try:
            with open(local_path, 'wb+') as path:
                path.write(file_data.read())

            file_name = file_data.name
            file_path = f"{tenant_id}/{template_id}/{file_name}"  # Updated file_path format
            S3Service.upload_file_from_path(local_file_path=local_path, s3_file_path=file_path)

            pdf_s3_file_path = f"{tenant_id}/{template_id}"

            document_upload = DocxToPdfConverter()
            document_upload.convert_docx_to_pdf(local_path, pdf_s3_file_path)

            pdf_file_name = file_name.replace(".docx", ".pdf")

            pdf_s3_file_path = f"{tenant_id}/{template_id}/{pdf_file_name}"
        finally:
            # Remove the temporary file, even if there was an issue with S3 upload
            os.remove(local_path)

        return file_path, pdf_s3_file_path

    @swagger_auto_schema(
        operation_description="Upload a file with name and description",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="File to upload",
            ),
        ],
        request_body=ContractTemplateCreateSerializer,
    )
    def create(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        logger.info("Contract template creation for tenant id %s", tenant_id)
        user = get_user_obj_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)

        form_data = {
            "created_by": user,
            "updated_by": user,
            "tenant_id": tenant,
            "name": request.data.get("name"),
            "description": request.data.get("description"),
            "s3_doc_file_path": "",
            "s3_pdf_file_path": "",
        }
        serializer = ContractTemplateCreateSerializer(data=form_data)

        if serializer.is_valid():
            file_data = request.data['file']
            if file_data:
                file_name = file_data.name
                if file_name.lower().endswith('.docx'):
                    # Create the contract template object without saving it yet
                    contract_template = ContractTemplate(**form_data)
                    template_id = str(contract_template.id)  # Get the template_id
                    file_path, s3_pdf_file_path = self.handle_file_upload(file_data, tenant_id, template_id)
                    contract_template.s3_doc_file_path = file_path  # Update the object
                    contract_template.s3_pdf_file_path = s3_pdf_file_path
                    contract_template.save()  # Save the updated object

                    return ResponseBuilder.success(
                        data={"id": contract_template.id, "name": contract_template.name},
                        status_code=status.HTTP_201_CREATED,
                    )
                else:
                    return ResponseBuilder.errors(
                        message="Uploaded file extension is not supported. Only .docx files are allowed",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )
        return ResponseBuilder.errors(
            message="Error",
            data=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = serializer.data
        response_data["presigned_url"] = S3Service.generate_presigned_url(
            response_data["s3_doc_file_path"]
        )
        response_data["pdf_presigned_url"] = S3Service.generate_presigned_url(response_data['s3_pdf_file_path'])
        return ResponseBuilder.success(
            message="success", data=response_data, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        operation_description="Upload a file with name and description",
        manual_parameters=[
            openapi.Parameter(
                "file",
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=False,
                description="File to upload",
            ),
        ],
        request_body=ContractTemplateCreateSerializer,
    )
    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        form_data = request.data

        serializer = ContractTemplateCreateSerializer(data=form_data)

        if serializer.is_valid():
            file_data = request.data.get('file')
            if file_data:
                file_name = file_data.name
                if file_name.lower().endswith('.docx'):
                    template_id = str(instance.id)  # Get the template_id
                    file_path, s3_pdf_file_path = self.handle_file_upload(file_data, tenant_id, template_id)
                    if instance.s3_doc_file_path != file_path:
                        S3Service.delete_s3_object(instance.s3_doc_file_path)
                        S3Service.delete_s3_object(instance.s3_pdf_file_path)
                    instance.s3_doc_file_path = file_path
                    instance.s3_pdf_file_path = s3_pdf_file_path
                else:
                    return ResponseBuilder.errors(
                        message="Uploaded file extension is not supported. Only .docx files are allowed",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

            instance.name = form_data.get("name")
            instance.description = form_data.get("description")
            for attr, value in form_data.items():
                setattr(instance, attr, value)
            instance.save()  # Save the updated object
            return ResponseBuilder.success(
                message="File Updated successfully",
                data={"id": instance.id},
                status_code=status.HTTP_200_OK,
            )
        return ResponseBuilder.errors(
            message="Error",
            status_code=status.HTTP_400_BAD_REQUEST,
            data=serializer.errors,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        S3Service.delete_s3_object(instance.s3_doc_file_path)
        instance.is_deleted = True
        instance.save()
        return ResponseBuilder.success(status_code=status.HTTP_200_OK)
