import json

from django.db import IntegrityError, transaction
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import (
    Feature,
    FeatureGroup,
    FeatureRepository,
    FeatureRepositoryHistory,
)
from api.feature_repository.serializers import FeatureAssignmentDataSerializer
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import RepositoryNotExistsException, \
    FeatureGroupNotExistsException, FeatureNotExistsException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class FeatureRepositoryDetailView(APIView):
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request, id):
        logger.info('GET feature repository details view')
        tenant_id = get_tenant_id_from_email(request.user[0])
        feature_repository = FeatureRepository.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not feature_repository:
            logger.error(f"feature repository not found for given id - {id}")
            raise RepositoryNotExistsException("Feature Repository not found")

        feature_groups = FeatureGroup.objects.filter(
            feature_repository_id=feature_repository,
            is_deleted=False,
            tenant_id=tenant_id,
        ).order_by('created_on').values()
        unassigned_features = Feature.objects.filter(
            Q(feature_repository_id=feature_repository) & Q(feature_group_id=None),
            is_deleted=False,
            tenant_id=tenant_id,
        ).order_by('created_on').values()

        data = {
            "feature_groups": [
                {
                    **feature_group,
                    "features": [
                        {
                            **feature,
                        }
                        for feature in Feature.objects.filter(
                            feature_group_id=feature_group["id"],
                            is_deleted=False,
                            tenant_id=tenant_id,
                        ).values()
                    ],
                }
                for feature_group in feature_groups
            ],
            "features": list(unassigned_features),
        }

        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=FeatureAssignmentDataSerializer,
        operation_description="Create or update feature groups and features",
        responses={
            status.HTTP_201_CREATED: openapi.Response(
                description="Feature Assignment successful!"
            )
        },
    )
    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
        feature_repository_id = id
        serializer = FeatureAssignmentDataSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        input_data = serializer.validated_data

        previous_data = {}
        if request.auth and request.auth[0]:
            response = self.get(request, id)
            previous_data = json.loads(response.content).get('data')
        feature_repository = FeatureRepository.objects.filter(
            id=feature_repository_id, tenant_id=tenant_id, is_deleted=False).first()
        if not feature_repository:
            logger.error(f'feature repository not found for given id - {feature_repository_id}')
            raise RepositoryNotExistsException("FeatureRepository does not exist")

        feature_groups_data = input_data["feature_groups"]
        features_data = input_data["features"]

        with transaction.atomic():
            feature_group_ids = []
            feature_ids = []

            # Check for duplicate feature names within the same repository
            all_feature_group_names = set(FeatureGroup.objects.filter(
                feature_repository_id=feature_repository_id, is_deleted=False, tenant_id=tenant_id
            ).values_list("name", flat=True))

            # Check for duplicate feature names within the same repository
            all_feature_names = set(Feature.objects.filter(
                feature_repository_id=feature_repository_id, is_deleted=False, tenant_id=tenant_id
            ).values_list("name", flat=True))

            for index, feature_group_data in enumerate(feature_groups_data):
                features_data_group = feature_group_data.pop("features", [])
                feature_group_id = feature_group_data.get("id")

                if feature_group_id:
                    feature_group = FeatureGroup.objects.get(
                        id=feature_group_id,
                        feature_repository_id=feature_repository,
                        is_deleted=False,
                        tenant_id=tenant_id,
                    )

                    # Check if the updated name already exists (
                    # excluding the current feature group)
                    new_name = feature_group_data.get("name")
                    existing_names = all_feature_group_names.copy()
                    existing_names.remove(feature_group.name)

                    if new_name in existing_names:
                        logger.error(f"feature group with the name '{new_name}' "
                                     f"already exists in the repository")
                        return ResponseBuilder.errors(
                            message=f"A Feature Group with the name '{new_name}' "
                                    f"already exists in the Repository.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )

                    if not feature_group:
                        logger.error(f"feature group does not "
                                     f"exist for given id - {feature_group_id}")
                        raise FeatureGroupNotExistsException("Feature group does not exist")
                    feature_group = FeatureGroup.objects.get(
                        id=feature_group_id, feature_repository_id=feature_repository,
                        is_deleted=False, tenant_id=tenant_id)
                    if not feature_group:
                        logger.error(f"feature group does not "
                                     f"exist for given id - {feature_group_id}")
                        raise FeatureGroupNotExistsException("Feature group does not exist")
                    feature_group_ids.append(feature_group_id)
                    feature_group.name = feature_group_data.get("name", feature_group.name)
                    feature_group.external_name = feature_group_data.get(
                        "external_name", feature_group.external_name
                    )
                    feature_group.external_description = feature_group_data.get(
                        "external_description", feature_group.external_description
                    )
                    feature_group.is_independent = feature_group_data.get(
                        "is_independent", feature_group.is_independent
                    )
                    feature_group.sort_order = (
                        index  # Assigning sort order based on index
                    )
                    feature_group.is_deleted = False  # Restoring feature group
                    feature_group.save()
                else:
                    if "name" not in feature_group_data:
                        logger.error("feature group without a name")
                        return ResponseBuilder.errors(
                            message="Feature Group without a name",
                            status_code=status.HTTP_404_NOT_FOUND,
                        )

                    feature_group_name = feature_group_data.get("name")
                    if feature_group_name in all_feature_group_names:
                        logger.error(f"feature group with the name '{feature_group_name}' "
                                     f"already exists in the repository")
                        return ResponseBuilder.errors(
                            message=f"A Feature Group with the name '{feature_group_name}' already exists in the Repository.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )

                    try:
                        feature_group = FeatureGroup.objects.create(
                            feature_repository_id=feature_repository,
                            sort_order=index,  # Assigning sort order based on index
                            is_deleted=False,  # Restoring feature group
                            tenant_id=tenant_obj,
                            **feature_group_data,
                        )
                    except IntegrityError:
                        logger.error("Invalid feature_group data. Duplicate feature_group ID")
                        ResponseBuilder.errors(
                            message="Invalid feature_group data. Duplicate feature_group ID.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )

                    feature_group_ids.append(feature_group.id)

                # Increment the feature index for each feature within the feature group
                feature_index = 0

                for feature_data in features_data_group:
                    feature_id = feature_data.get("id")
                    feature_name = feature_data.get("name")
                    if feature_id:
                        feature = Feature.objects.filter(
                            id=feature_id, is_deleted=False, tenant_id=tenant_id).first()
                        if not feature:
                            logger.error(f"feature does not exist for given if - {feature_id}")
                            raise FeatureNotExistsException("Feature does not exist")

                        feature_ids.append(feature.id)
                        updated_fields = {}  # Store the updated fields

                        if feature_name is not None and feature.name != feature_name:
                            # Check if the updated name already exists (
                            # excluding the current feature)
                            existing_names = all_feature_names.copy()
                            existing_names.remove(feature.name)

                            if feature_name in existing_names:
                                logger.error(f"feature with the name '{feature_name}' "
                                             f"already exists in the Repository.")
                                return ResponseBuilder.errors(
                                    message=f"A Feature with the name '{feature_name}' "
                                            f"already exists in the Repository.",
                                    status_code=status.HTTP_400_BAD_REQUEST,
                                )
                            updated_fields["name"] = feature_name

                        if (
                                feature_index is not None
                                and feature.sort_order != feature_index
                        ):
                            updated_fields["sort_order"] = feature_index

                        if feature_group_id is not None:
                            feature_group = FeatureGroup.objects.filter(
                                id=feature_group_id, is_deleted=False, tenant_id=tenant_id).first()
                            if not feature_group:
                                logger.error("Feature group does not exist")
                                raise FeatureGroupNotExistsException(
                                    "Feature group does not exist")
                            if feature.feature_group_id != feature_group:
                                updated_fields["feature_group_id"] = feature_group
                        elif feature_group_id is None:
                            # Use feature_group_id from the loop
                            if feature_group_ids:
                                feature_group_id = feature_group_ids[-1]
                                feature_group = FeatureGroup.objects.filter(
                                    id=feature_group_id,
                                    is_deleted=False,
                                    tenant_id=tenant_id,
                                ).first()
                                if not feature_group:
                                    logger.error("Feature group does not exist")
                                    raise FeatureGroupNotExistsException(
                                        "Feature group does not exist")
                                if feature.feature_group_id != feature_group:
                                    updated_fields["feature_group_id"] = feature_group

                        if updated_fields:
                            Feature.objects.filter(
                                id=feature_id, tenant_id=tenant_id).update(**updated_fields)

                            # Retrieve the updated feature from the database
                            feature = Feature.objects.get(id=feature_id, tenant_id=tenant_id)

                            # Save the updated feature
                            feature.save()
                    else:
                        logger.error("Features can't be created inside a Feature Group")
                        return ResponseBuilder.errors(
                            message="Features can't be created inside a Feature Group",
                            status_code=status.HTTP_404_NOT_FOUND,
                        )

                    feature_index += 1

            # Create or update unassigned features
            for feature_data in features_data:
                feature_id = feature_data.get("id")
                feature_name = feature_data.get("name")

                if feature_id:
                    feature = Feature.objects.filter(
                        id=feature_id, is_deleted=False, tenant_id=tenant_id).first()
                    if not feature:
                        logger.error(f'feature does not exists for given id - {feature_id}')
                        raise FeatureNotExistsException("Feature does not exist")

                    feature_ids.append(feature.id)
                    feature.feature_group_id = None
                    if feature_name is not None and feature.name != feature_name:
                        # Check if the updated name already exists among other features (
                        # excluding the current feature)
                        existing_names = all_feature_names.copy()
                        existing_names.remove(feature.name)

                        if feature_name in existing_names:
                            logger.error(f"feature with the name '{feature_name}' "
                                         f"already exists in the Repository")
                            return ResponseBuilder.errors(
                                message=f"A Feature with the name '{feature_name}' "
                                        f"already exists in the Repository.",
                                status_code=status.HTTP_400_BAD_REQUEST,
                            )

                        feature.name = feature_name
                    feature.save()
                else:
                    if "name" not in feature_data:
                        logger.error("name is required for feature to be created")
                        return ResponseBuilder.errors(
                            message="Name is required for feature to be created.")

                    if feature_name in all_feature_names:
                        logger.error(f"feature with the name '{feature_name}' "
                                     f"already exists in the repository")
                        return ResponseBuilder.errors(
                            message=f"A Feature with the name '{feature_name}' "
                                    f"already exists in the Repository.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )
                    try:
                        feature = Feature.objects.create(
                            feature_repository_id=feature_repository,
                            feature_group_id=None,
                            sort_order=None,
                            is_deleted=False,
                            tenant_id=tenant_obj,
                            **feature_data,
                        )
                    except IntegrityError:
                        logger.error("Invalid feature data. Duplicate feature ID.")
                        return ResponseBuilder.errors(
                            message="Invalid feature data. Duplicate feature ID.",
                            status_code=status.HTTP_400_BAD_REQUEST,
                        )

                    feature.name = feature_name
                    feature_ids.append(feature.id)
                    feature.save()  # Save the newly created feature

            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info('feature assignments - this request is for user impersonation')
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                response = self.get(request, id)
                new_data = json.loads(response.content).get("data")

                FeatureRepositoryHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description="Feature assignment to feature group(s)",
                    tenant_id=tenant_obj,
                    feature_repository_id=feature_repository,
                    details=json.dumps(
                        {"new_data": new_data, "previous_data": previous_data}
                    ),
                )

        return ResponseBuilder.success(
            message="Feature Assignment successful!",
            status_code=status.HTTP_201_CREATED,
        )
