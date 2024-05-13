import json

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature, FeatureGroup, FeatureRepository, \
    FeatureRepositoryHistory
from api.feature_repository.serializers import RepositorySerializer
from api.plan.models import Plan
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import RepositoryNotExistsException, \
    ProductAssociatedWithRepository, FeatureGroupAssociatedWithRepository, \
    FeatureAssociatedWithRepository, PlanAssociatedWithRepository
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class RepositoryCreateView(generics.GenericAPIView):
    serializer_class = RepositorySerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "source",
                openapi.IN_QUERY,
                description="ID of the repository to inherit from",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ]
    )
    def post(self, request):
        logger.info('creating a repository')
        existing_repository_id = request.query_params.get("source")
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
        request.data.update({"tenant_id": tenant_id})
        repository_data = request.data
        description = 'Create a feature repository'
        details = json.dumps({})

        serializer = self.get_serializer(data=repository_data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            new_repository = serializer.save()  # Save the new repository

            if existing_repository_id:
                _ = get_object_or_404(
                    FeatureRepository, id=existing_repository_id, is_deleted=False)

                old_feature_group_ids = FeatureGroup.objects.filter(
                    feature_repository_id=existing_repository_id, is_deleted=False
                ).values_list("id", flat=True)

                feature_groups_to_clone = [
                    FeatureGroup(
                        name=old_feature_group.name,
                        external_name=old_feature_group.external_name,
                        external_description=old_feature_group.external_description,
                        feature_repository_id=new_repository,
                        sort_order=old_feature_group.sort_order,
                        is_independent=old_feature_group.is_independent,
                        tenant_id=tenant
                    )
                    for old_feature_group in FeatureGroup.objects.filter(
                        id__in=old_feature_group_ids, is_deleted=False, tenant_id=tenant_id
                    )
                ]

                new_feature_groups = FeatureGroup.objects.bulk_create(
                    feature_groups_to_clone
                )

                feature_group_id_mapping = {
                    old_id: new_group
                    for old_id, new_group in zip(
                        old_feature_group_ids, new_feature_groups
                    )
                }

                features_to_clone = Feature.objects.filter(
                    feature_repository_id=existing_repository_id, is_deleted=False,
                    tenant_id=tenant_id
                )

                features_to_create = [
                    Feature(
                        name=feature.name,
                        external_name=feature.external_name,
                        external_description=feature.external_description,
                        feature_repository_id=new_repository,
                        sort_order=feature.sort_order,
                        tenant_id=tenant,
                        feature_group_id=feature_group_id_mapping.get(
                            feature.feature_group_id.id,
                        )
                        if feature.feature_group_id
                        else None,
                    )
                    for feature in features_to_clone
                ]

                Feature.objects.bulk_create(features_to_create)

                # check for user impersonation
                description = 'Clone a feature repository'
                details = json.dumps(
                    {'cloned_feature_repository_id': existing_repository_id})

        response_data = serializer.data

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info('create/clone repository - this request is for user impersonation')
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            FeatureRepositoryHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description=description,
                tenant_id=tenant_obj,
                feature_repository_id=new_repository,
                details=details
            )
        response = ResponseBuilder.success(
            data=response_data, status_code=status.HTTP_201_CREATED
        )
        return response

    product_id = openapi.Parameter(
        "product_id", openapi.IN_QUERY, type=openapi.TYPE_STRING
    )

    @swagger_auto_schema(manual_parameters=[product_id])
    def get(self, request):
        logger.info('get repository')
        tenant_id = get_tenant_id_from_email(request.user[0])
        product_id = request.query_params.get("product_id")

        if product_id:
            repository = FeatureRepository.objects.filter(
                product_id=product_id, is_deleted=False, tenant_id=tenant_id)
        else:
            repository = FeatureRepository.objects.filter(is_deleted=False, tenant_id=tenant_id)
        repository = RepositorySerializer(repository, many=True).data
        return ResponseBuilder.success(
            data=repository, status_code=status.HTTP_200_OK
        )


class RepositoryView(generics.GenericAPIView):
    serializer_class = RepositorySerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def delete(request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        repository = FeatureRepository.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not repository:
            logger.error('feature repository not found for given id - %s', id)
            raise RepositoryNotExistsException("Repository not found")

        # check if any product is associated with the repository
        if not request.product_id.is_deleted:
            logger.error('Unable to delete the repository as '
                         'it is associated with the product - %s', id)
            raise ProductAssociatedWithRepository(
                "Unable to delete the repository as it is associated with the product")

        # check if any feature is associated with the repository
        feature_obj = Feature.objects.filter(
            feature_repository_id=repository.id, tenant_id=tenant_id, is_deleted=False)
        if feature_obj:
            logger.error('Unable to delete the repository as '
                         'it is associated with the feature(s) - %s', id)
            raise FeatureAssociatedWithRepository(
                "Unable to delete the repository as it is associated with the feature(s)")

        # check if any feature is associated with the repository
        feature_group_obj = FeatureGroup.objects.filter(
            feature_repository_id=repository.id, tenant_id=tenant_id, is_deleted=False)
        if feature_group_obj:
            logger.error('Unable to delete the repository as '
                         'it is associated with the feature group(s) - %s', id)
            raise FeatureGroupAssociatedWithRepository(
                "Unable to delete the repository as it is associated with the feature group(s)")

        # check if any plan is associated with the repository
        plan_obj = Plan.objects.filter(
            feature_repository_id=repository.id, tenant_id=tenant_id, is_deleted=False)
        if plan_obj:
            logger.error('Unable to delete the repository as '
                         'it is associated with the plan - %s', id)
            raise PlanAssociatedWithRepository(
                "Unable to delete the repository as it is associated with the plan")

        repository.is_deleted = True
        repository.save()
        return ResponseBuilder.success(message="Repository deleted successfully")


class RepositoryByProductView(generics.ListAPIView):
    serializer_class = RepositorySerializer

    product_id = openapi.Parameter(
        "product_id",
        openapi.IN_QUERY,
        description="field you want to order by to",
        type=openapi.TYPE_STRING,
    )

    @swagger_auto_schema(manual_parameters=[product_id])
    def get_queryset(self):
        return FeatureRepository.objects.filter(
            product_id=self.kwargs["product_id"], is_deleted=False)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        repositories = serializer.data

        # Extract only the name and id fields from each repository
        simplified_repositories = [
            {"name": repo["name"], "id": repo["id"]} for repo in repositories
        ]

        return ResponseBuilder.success(
            data=simplified_repositories, status_code=status.HTTP_200_OK
        )
