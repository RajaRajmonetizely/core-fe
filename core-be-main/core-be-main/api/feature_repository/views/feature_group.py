import json

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature, FeatureGroup, FeatureRepository, \
    FeatureGroupHistory
from api.feature_repository.serializers import (
    FeatureGroupCreateSerializer,
    FeatureGroupOrderSerializer,
    FeatureGroupSerializer,
    FeatureGroupUpdateSerializer,
)
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import RepositoryNotExistsException, \
    FeatureGroupNotExistsException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class FeatureGroupCreateView(GenericAPIView):
    serializer_class = FeatureGroupCreateSerializer

    @staticmethod
    def post(request, id):
        logger.info('creating a feature group')
        feature_repository = FeatureRepository.objects.filter(id=id, is_deleted=False).first()
        if feature_repository:
            # Add feature_repository_id to request_data
            feature_group_data = request.data
            feature_group_data["feature_repository_id"] = id
            serializer = FeatureGroupCreateSerializer(data=feature_group_data)
            if serializer.is_valid():
                feature_group = serializer.save(
                    feature_repository_id=feature_repository
                )
                response_data = {
                    "status": "success",
                    "data": FeatureGroupSerializer(feature_group).data,
                }
                return ResponseBuilder.success(
                    data=response_data, status_code=status.HTTP_201_CREATED
                )
            return ResponseBuilder.errors(
                data=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST
            )
        return ResponseBuilder.errors(
            message="Feature Repository not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class FeatureGroupListView(GenericAPIView):
    serializer_class = FeatureGroupSerializer

    @staticmethod
    def get(request, id):
        feature_repository = FeatureRepository.objects.filter(id=id, is_deleted=False).first()
        if not feature_repository:
            logger.error(f'feature repository not found for given id - {id}')
            raise RepositoryNotExistsException("Feature Repository not found")

        feature_groups = FeatureGroup.objects.filter(feature_repository_id=id, is_deleted=False)
        serializer = FeatureGroupSerializer(feature_groups, many=True)
        return ResponseBuilder.success(
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class FeatureGroupUpdateView(GenericAPIView):
    serializer_class = FeatureGroupUpdateSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def patch(request, id):
        logger.info(f'updating a feature group for given id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        feature_group = FeatureGroup.objects.filter(
            id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not feature_group:
            logger.error(f'feature group not found for given id - {id}')
            raise FeatureGroupNotExistsException("Feature Group not found")

        serializer = FeatureGroupSerializer(feature_group, data=request.data, partial=True)

        previous_data = dict(
            name=feature_group.name, external_name=feature_group.external_name,
            external_description=feature_group.external_description,
            feature_repository_id=str(feature_group.feature_repository_id.id)
            if feature_group.feature_repository_id else None,
            sort_order=feature_group.sort_order,
            is_independent=feature_group.is_independent
        )
        if serializer.is_valid():
            new_name = serializer.validated_data.get('name')

            # Check if the new name already exists among other feature groups
            # (excluding the current feature group)
            existing_names = set(FeatureGroup.objects.filter(
                feature_repository_id=feature_group.feature_repository_id,
                is_deleted=False, tenant_id=tenant_id
            ).exclude(id=feature_group.id).values_list("name", flat=True))

            if new_name and new_name in existing_names:
                logger.error(f"A Feature Group with the name '{new_name}' "
                             f"already exists in the Repository")
                return ResponseBuilder.errors(
                    message=f"A Feature Group with the name '{new_name}' "
                            f"already exists in the Repository.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save()
            response = serializer.data

            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info('update feature group - this request is for user impersonation')
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                FeatureGroupHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description='Updating a feature group',
                    tenant_id=tenant_obj,
                    feature_group_id=feature_group,
                    details=json.dumps(
                        {'new_data': {
                            'name': response.get('name'),
                            'external_name': response.get('external_name'),
                            'external_description': response.get('external_description'),
                            'feature_repository_id': str(response.get('feature_repository_id')),
                            'sort_order': response.get('sort_order'),
                            'is_independent': response.get('is_independent'),
                            'feature_group_id': str(response.get('feature_group_id'))
                        },
                            'previous_data': previous_data})
                )
            return ResponseBuilder.success(
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        return ResponseBuilder.errors(
            data=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST
        )

    @staticmethod
    def delete(request, id):
        logger.info(f'deleting a feature group for given id - {id}')
        tenant_id = get_tenant_id_from_email(request.user[0])
        feature_group = FeatureGroupDetailView.get_object(id)
        if not feature_group:
            logger.error(f'feature group not found for given id - {id}')
            raise FeatureGroupNotExistsException("Feature Group not found")

        feature_group.is_deleted = True
        feature_group.save()

        # Get all the features that belong to the feature_group
        features = Feature.objects.filter(feature_group_id=id, is_deleted=False)

        # Remove the feature_group from each feature and remove sort_order
        features.update(feature_group_id=None, sort_order=None)

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info('delete feature group - this request is for user impersonation')
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            FeatureGroupHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description='Feature Group Deleted',
                tenant_id=tenant_obj,
                feature_group_id=feature_group,
                details=json.dumps({})
            )

        return ResponseBuilder.success(
            message="Feature Group Soft Deleted Successfully",
            status_code=status.HTTP_200_OK,
        )


class FeatureGroupDetailView(GenericAPIView):
    serializer_class = FeatureGroupSerializer

    @staticmethod
    def get_object(id):
        return FeatureGroup.objects.filter(id=id, is_deleted=False).first()

    @staticmethod
    def get(request, id):
        feature_group = FeatureGroupDetailView.get_object(id)
        if not feature_group:
            raise FeatureGroupNotExistsException("Feature Group not found")

        serializer = FeatureGroupSerializer(feature_group)
        return ResponseBuilder.success(
            data=serializer.data, status_code=status.HTTP_200_OK
        )


class FeatureGroupOrderAPIView(GenericAPIView):
    serializer_class = FeatureGroupOrderSerializer

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "feature_group_id": openapi.Schema(type=openapi.TYPE_STRING),
                    "sort_order": openapi.Schema(type=openapi.TYPE_INTEGER),
                },
                required=["feature_group_id", "sort_order"],
            ),
        )
    )
    def patch(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        feature_orders = serializer.validated_data

        feature_group_ids = [
            feature_order["feature_group_id"] for feature_order in feature_orders
        ]
        feature_groups = FeatureGroup.objects.filter(id__in=feature_group_ids)

        feature_group_objects = []
        for feature_order in feature_orders:
            feature_group_id = feature_order["feature_group_id"]
            sort_order = feature_order["sort_order"]

            try:
                feature_group = next(
                    fg for fg in feature_groups if fg.id == feature_group_id
                )
            except StopIteration:
                return ResponseBuilder.errors(
                    message=f"Feature Group with ID {feature_group_id} does not exist",
                    status_code=status.HTTP_404_NOT_FOUND,
                )

            feature_group.sort_order = sort_order
            feature_group_objects.append(feature_group)

        FeatureGroup.objects.bulk_update(feature_group_objects, ["sort_order"])

        return ResponseBuilder.errors(
            message="Feature Group order updated successfully",
            status_code=status.HTTP_200_OK,
        )
