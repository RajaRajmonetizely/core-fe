from django.db import models

from api.user.models import User, UserRole
from api.utils.models import AbstractModel


class FeatureList(AbstractModel):
    name = models.CharField(max_length=100, null=False)
    method = models.CharField(max_length=100, null=False)
    description = models.TextField()

    class Meta:
        db_table = "feature_list"


class RoleFeatureMapping(AbstractModel):
    user_role_id = models.ForeignKey(
        UserRole,
        on_delete=models.CASCADE,
        null=True,
        db_column="user_role_id"
    )
    feature_list_id = models.ForeignKey(
        FeatureList,
        on_delete=models.CASCADE,
        null=False,
        db_column="feature_list_id"
    )

    class Meta:
        db_table = "role_feature_mapping"


class UserFeature(AbstractModel):
    user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        db_column="user_id"
    )
    feature_list_id = models.ForeignKey(
        FeatureList,
        on_delete=models.CASCADE,
        null=False,
        db_column="feature_list_id"
    )

    class Meta:
        db_table = "user_feature"
