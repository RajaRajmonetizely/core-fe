import json

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature, FeatureHistory
from api.feature_repository.serializers import (
    FeatureCreateSerializer,
    FeatureOrderSerializer,
    FeatureSerializer,
    FeatureUpdateSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import FeatureNotExistsException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class FeatureCreateView(GenericAPIView):
    serializer_class = FeatureCreateSerializer

    @staticmethod
    def post(request):
        repository_data = request.data

        serializer = FeatureCreateSerializer(data=repository_data)

        if serializer.is_valid():
            serializer.save()
            return ResponseBuilder.success(
                message="Feature created successfully",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
            )

        return ResponseBuilder.errors(
            message="Invalid data in the request",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class FeatureView(GenericAPIView):
    serializer_class = FeatureSerializer

    @staticmethod
    def get(request, id):
        queryset = Feature.objects.filter(id=id, is_deleted=False).first()
        if not queryset:
            raise FeatureNotExistsException("Feature not found")
        serializer = FeatureSerializer(queryset)
        return ResponseBuilder.success(
            message="Fetched Feature",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class FeatureDeleteView(GenericAPIView):
    serializer_class = FeatureSerializer

    @staticmethod
    def delete(request, id):
        logger.info(f'deleting a feature with id - {id}')
        feature = Feature.objects.filter(id=id, is_deleted=False).first()
        if not feature:
            logger.error(f'feature not found for given id - {id}')
            raise FeatureNotExistsException("Feature not found")

        feature.is_deleted = True
        feature.save()

        # Additional logic or response handling if needed
        return ResponseBuilder.success(
            message="Feature deleted successfully", status_code=status.HTTP_200_OK
        )


class FeatureUpdateView(GenericAPIView):
    serializer_class = FeatureUpdateSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def patch(request, id):
        logger.info(f'updating a feature with id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        feature = Feature.objects.filter(id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not feature:
            logger.error(f'feature not found for given id - {id}')
            raise FeatureNotExistsException("Feature not found")

        previous_data = dict(
            name=feature.name, external_name=feature.external_name,
            external_description=feature.external_description,
            feature_repository_id=str(feature.feature_repository_id.id)
            if feature.feature_repository_id else None, sort_order=feature.sort_order,
            feature_group_id=str(
                feature.feature_group_id.id) if feature.feature_group_id else None)
        serializer = FeatureSerializer(feature, data=request.data, partial=True)
        if serializer.is_valid():
            new_name = serializer.validated_data.get('name')

            # Check if the name already exists among other features (excluding the current feature)
            existing_names = set(Feature.objects.filter(
                feature_repository_id=feature.feature_repository_id,
                is_deleted=False, tenant_id=tenant_id
            ).exclude(id=feature.id).values_list("name", flat=True))

            if new_name and new_name in existing_names:
                logger.error(f"A Feature with the name '{new_name}' "
                             f"already exists in the Repository")
                return ResponseBuilder.errors(
                    message=f"A Feature with the name '{new_name}' "
                            f"already exists in the Repository.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save()
            response = serializer.data
            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info('update feature - this request is for user impersonation')
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                FeatureHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description='Updating a feature',
                    tenant_id=tenant_obj,
                    feature_id=feature,
                    details=json.dumps(
                        {'new_data': {
                            'name': response.get('name'),
                            'external_name': response.get('external_name'),
                            'external_description': response.get('external_description'),
                            'feature_repository_id': str(response.get('feature_repository_id')),
                            'sort_order': response.get('sort_order'),
                            'feature_group_id': str(response.get('feature_group_id'))
                        },
                            'previous_data': previous_data})
                )
            return ResponseBuilder.success(
                data=response,
                status_code=status.HTTP_200_OK,
            )
        return ResponseBuilder.errors(
            data=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    def delete(request, id):
        logger.info(f'deleting a feature with id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        feature = Feature.objects.filter(id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not feature:
            logger.error(f'feature not found for given id - {id}')
            raise FeatureNotExistsException("Feature not found")

        feature.is_deleted = True
        feature.save()

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info('delete feature - this request is for user impersonation')
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            FeatureHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description='Feature Deleted',
                tenant_id=tenant_obj,
                feature_id=feature,
                details=json.dumps({})
            )

        # Additional logic or response handling if needed
        return ResponseBuilder.success(
            message="Feature deleted successfully", status_code=status.HTTP_200_OK
        )


class FeatureOrderView(GenericAPIView):
    serializer_class = FeatureOrderSerializer

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "feature_id": openapi.Schema(type=openapi.TYPE_STRING),
                    "sort_order": openapi.Schema(type=openapi.TYPE_INTEGER),
                },
                required=["feature_id", "sort_order"],
            ),
        )
    )
    def patch(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        feature_orders = serializer.validated_data

        feature_ids = [feature_order["feature_id"] for feature_order in feature_orders]
        features = Feature.objects.filter(id__in=feature_ids)

        feature_objects = []
        for feature_order in feature_orders:
            feature_id = feature_order["feature_id"]
            sort_order = feature_order["sort_order"]

            try:
                feature = next(f for f in features if f.id == feature_id)
            except StopIteration:
                return Response(
                    {"message": f"Feature with ID {feature_id} does not exist"},
                    status_code=status.HTTP_404_NOT_FOUND,
                )

            feature.sort_order = sort_order
            feature_objects.append(feature)

        Feature.objects.bulk_update(feature_objects, ["sort_order"])

        return Response(
            {"message": "Feature order updated successfully"},
            status_code=status.HTTP_200_OK,
        )


class FeatureByRepositoryView(GenericAPIView):
    serializer_class = FeatureSerializer

    def get_queryset(self):
        return Feature.objects.filter(
            feature_repository_id=self.kwargs["feature_repository_id"], is_deleted=False
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        features = serializer.data

        # Extract only the name and id fields from each repository
        all_features = [
            {
                "id": feature["id"],
                "name": feature["name"],
                "external_name": feature["external_name"],
                "external_description": feature["external_description"],
            }
            for feature in features
        ]

        return ResponseBuilder.success(
            data=all_features, status_code=status.HTTP_200_OK
        )
