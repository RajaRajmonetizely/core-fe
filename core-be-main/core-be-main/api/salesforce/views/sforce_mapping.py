import json
import os
import uuid

import requests
from django.db import transaction
from django.http import JsonResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from api.account.models import Account, Opportunity, Contract
from api.user.models import User, OrgHierarchy
from api.pricing_calculator.models import Quote

from api.auth.authentication import CognitoAuthentication
from api.salesforce.models import SalesforceMappingModel, SalesforceMappingHistory
from api.salesforce.serializers.salesforce_mapping import (
    SalesforceMappingCreateSerializer,
    SalesforceMappingSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import SalesforceConfigError
from api.utils.responses import ResponseBuilder
from api.utils.salesforce.salesforce_util import SForceUtil
from api.utils.aws_utils.secrets import AwsSecret


class SFMappingObjects(GenericAPIView):
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "sobject",
                openapi.IN_QUERY,
                description="Salesforce Object",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=True,
            ),
            openapi.Parameter(
                "db_model",
                openapi.IN_QUERY,
                description="DB Model",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=True,
            ),
        ],
    )
    def get(self, request):
        db_fields = []
        sobject = request.query_params.get("sobject")
        db_model = eval(request.query_params.get("db_model"))
        for field in db_model._meta.fields:
            db_fields.append(field.get_attname_column()[1])
        tenant_id = get_tenant_id_from_email(request.user[0])
        config = AwsSecret.get(secret_id=SForceUtil.secret_id).get(str(tenant_id), {})
        if not config:
            return ResponseBuilder.success(
                message="success",
                data={"db_fields": [], "sf_fields": []},
            )
        access_token = SForceUtil.get_salesforce_login(config)
        headers = {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json",
        }
        url = f"{config['url']}/sobjects/{sobject}/describe"
        response = requests.get(url, headers=headers)

        # Extract the data from the response
        data = response.json()
        sf_data_fields = [item["name"] for item in data["fields"]]
        return ResponseBuilder.success(
            message="success",
            data={"db_fields": db_fields, "sf_fields": sf_data_fields},
        )


class SFMapping(GenericAPIView):
    """Salesforce Mapping"""

    authentication_classes = [CognitoAuthentication]
    serializer_class = SalesforceMappingSerializer

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        return SalesforceMappingModel.objects.filter(
            tenant_id=tenant_id, is_deleted=False
        )

    def get(self, request):
        salesforce_mapping = self.get_queryset()

        if not salesforce_mapping.exists():
            return JsonResponse(
                {"message": "Salesforce Mapping Does Not Exist"},
                status=status.HTTP_200_OK,
            )

        response_data = [
            {
                "id": sf_mapping.id,
                "name": sf_mapping.name,
                "sf_column_mapping": json.loads(sf_mapping.sf_column_mapping),
                "m_column_mapping": json.loads(sf_mapping.m_column_mapping),
                "config": json.loads(sf_mapping.config) if sf_mapping.config else None,
            }
            for sf_mapping in salesforce_mapping
        ]

        return ResponseBuilder.success(
            data=response_data, status_code=status.HTTP_200_OK
        )

    @swagger_auto_schema(request_body=SalesforceMappingCreateSerializer)
    def post(self, request):
        payload = request.data
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        tenant = get_object_or_404(Tenant, id=tenant_id, is_deleted=False)

        # Check if an object with the given name exists for the specific tenant
        if SalesforceMappingModel.objects.filter(
            name=payload["name"], tenant_id=tenant, is_deleted=False
        ).exists():
            raise ValidationError(
                "A mapping with this name already exists for the tenant."
            )

        mapping_obj = SalesforceMappingModel.objects.create(
            name=payload["name"],
            sf_column_mapping=json.dumps(payload["sf_column_mapping"]),
            m_column_mapping=json.dumps(payload["m_column_mapping"]),
            config=json.dumps(
                payload.get("config", {})
            ),  # Provide an empty dictionary if config is not provided
            tenant_id=tenant,
        )

        if mapping_obj:
            serializer = SalesforceMappingSerializer(mapping_obj)

            # Create audit history entry
            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    new_data = CommonUtils.convert_uuids_to_strings(serializer.data)

                    mapping_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "salesforce_mapping_id": mapping_obj,
                        "description": "Creating a Salesforce Mapping",
                        "details": json.dumps({"new_data": new_data}),
                        "tenant_id": tenant_obj,
                    }
                    SalesforceMappingHistory.objects.create(**mapping_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
            )

        return ResponseBuilder.errors(
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SFMappingDetail(GenericAPIView):
    """Salesforce Mapping Details"""

    authentication_classes = [CognitoAuthentication]
    serializer_class = SalesforceMappingSerializer

    def get_object(self, id):
        return get_object_or_404(SalesforceMappingModel, id=id)

    def get(self, request, id):
        sf_mapping = self.get_object(id)
        response = {
            "id": sf_mapping.id,
            "name": sf_mapping.name,
            "sf_column_mapping": json.loads(sf_mapping.sf_column_mapping),
            "m_column_mapping": json.loads(sf_mapping.m_column_mapping),
            "config": json.loads(sf_mapping.config) if sf_mapping.config else None,
        }
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    def put(self, request, id):
        try:
            payload = request.data
            sf_mapping = self.get_object(id)

            # Create dictionaries to store new_data and previous_data for each field
            new_data_dict = {}
            previous_data_dict = {}

            # Update fields if they exist in the payload
            fields_to_update = ["m_column_mapping", "sf_column_mapping", "config"]
            for field in fields_to_update:
                if field in payload:
                    previous_data = getattr(sf_mapping, field)
                    setattr(sf_mapping, field, json.dumps(payload[field]))
                    new_data_dict[field] = payload[field]
                    previous_data_dict[field] = json.loads(previous_data) if previous_data else None

            sf_mapping.save()

            serializer = SalesforceMappingSerializer(sf_mapping)

            # Create audit history entry
            try:
                if request.auth and request.auth[0]:
                    tenant_id = get_tenant_id_from_email(request.user[0])
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    mapping_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "salesforce_mapping_id": sf_mapping,
                        "description": "Updating a Salesforce Mapping",
                        "details": json.dumps({
                            "new_data": new_data_dict,
                            "previous_data": previous_data_dict
                        }),
                        "tenant_id": tenant_obj,
                    }
                    SalesforceMappingHistory.objects.create(**mapping_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )

        except KeyError:
            return ResponseBuilder.errors(
                message="Invalid data provided",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
