import json

from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from api.pricing.models import PricingStructure
from api.pricing.serializers.structure import (
    CreatePricingStructureSerializer,
    PricingStructureSerializer,
)
from api.utils.responses import ResponseBuilder


class PricingStructureView(GenericAPIView):
    serializer_class = PricingStructureSerializer

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "id",
                openapi.IN_QUERY,
                description="Pricing Structure ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ],
        request_body=CreatePricingStructureSerializer(),
        operation_id="update_or_add_pricing_structure",
        responses={status.HTTP_200_OK: PricingStructureSerializer()},
    )
    def put(self, request, id=None):
        if id is None:
            # Perform create logic for POST request
            serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():
                serializer.create(request.data)
                return ResponseBuilder.success(
                    data=serializer.data, status_code=status.HTTP_201_CREATED
                )

            return ResponseBuilder.errors(
                message=serializer.error_messages,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        else:
            # Perform update logic for PUT request
            pricing_structure = get_object_or_404(PricingStructure, id=id)
            if not pricing_structure.pricing_model_id:
                return ResponseBuilder.errors(
                    message="Cannot edit Default Pricing Structure(s)",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            serializer = self.get_serializer(
                pricing_structure, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return ResponseBuilder.success(
                    data=serializer.data, status_code=status.HTTP_200_OK
                )

            return ResponseBuilder.errors(
                message=serializer.error_messages,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    @staticmethod
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "id",
                openapi.IN_QUERY,
                description="Pricing model ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def get(request, *args, **kwargs):
        pricing_model_id = request.query_params.get("id")
        result_set = PricingStructure.objects.filter(is_deleted=False)

        if pricing_model_id is None:
            # Retrieve records where pricing_model_id is null
            result_set = result_set.filter(pricing_model_id__isnull=True)
        else:
            # Retrieve records with the specific pricing_model_id and null values
            result_set = result_set.filter(
                Q(pricing_model_id=pricing_model_id) | Q(pricing_model_id__isnull=True)
            )

        pricing_structures = PricingStructureSerializer(result_set, many=True).data

        # Get all the values for pricing_model_id and where pricing_model_id is null
        all_pricing_structures = [
            {
                "id": structure["id"],
                "name": structure["name"],
                "custom_formula": structure["custom_formula"],
                "pricing_model_id": structure["pricing_model_id"],
                "details": json.loads(structure["details"]),
            }
            for structure in pricing_structures
        ]
        return Response(data=all_pricing_structures, status=status.HTTP_200_OK)
