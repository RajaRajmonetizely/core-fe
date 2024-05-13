import csv

from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import (
    Feature,
    FeatureGroup,
    FeatureRepository,
)
from api.feature_repository.serializers.upload_features import FileUploadSerializer
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import RepositoryNotExistsException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class UploadFeatureAndGroups(GenericAPIView):
    authentication_classes = [CognitoAuthentication]
    serializer_class = FileUploadSerializer

    @staticmethod
    def post(request, id):
        logger.info(f'Inside upload feature and feature groups')
        tenant_id = get_tenant_id_from_email(request.user[0])

        feature_repository_obj = FeatureRepository.objects.filter(
            id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not feature_repository_obj:
            logger.error('feature repository not found for given id %s ', id)
            raise RepositoryNotExistsException('Feature Repository Not Found')

        file = request.FILES['file']
        decoded_file = file.read().decode('utf-8')
        csv_reader = csv.reader(decoded_file.splitlines(), delimiter=',')

        # Read the first row to get column names
        header = next(csv_reader)

        # Create a dictionary to store column data
        columns = {col: [] for col in header}

        # Read data row by row and store in columns
        for row in csv_reader:
            for col, value in zip(header, row):
                columns[col].append(value)

        # Print the column-wise data
        tenant_obj = Tenant.objects.filter(id=tenant_id, is_deleted=False).first()
        sort_order = 0
        for col, data in columns.items():
            feature_group_ob = FeatureGroup.objects.create(
                name=col, feature_repository_id=feature_repository_obj,
                sort_order=sort_order, tenant_id=tenant_obj
            )
            features_to_be_added = [
                Feature(
                    name=feature, feature_repository_id=feature_repository_obj, sort_order=index,
                    feature_group_id=feature_group_ob, tenant_id=tenant_obj
                )
                for index, feature in enumerate(data) if feature
            ]
            Feature.objects.bulk_create(features_to_be_added)
            sort_order += 1
        return ResponseBuilder.success(
            message="Feature Group and Features are Uploaded Successfully",
            status_code=status.HTTP_201_CREATED,
        )
