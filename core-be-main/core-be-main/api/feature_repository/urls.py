from django.urls import path

from api.feature_repository.views.feature_group_assignment import (
    FeatureRepositoryDetailView,
)
from .views import (
    FeatureByRepositoryView,
    FeatureGroupUpdateView,
    FeatureUpdateView,
    RepositoryCreateView,
    UploadFeatureAndGroups
)

urlpatterns = [
    path("", RepositoryCreateView.as_view(), name="repository-get-create"),
    path("/feature/<str:id>", FeatureUpdateView.as_view(), name="feature-update"),
    path(
        "/repository/<str:id>/features",
        FeatureByRepositoryView.as_view(),
        name="features-for-repository",
    ),
    path(
        "/feature_group/<uuid:id>",
        FeatureGroupUpdateView.as_view(),
        name="feature_group_update",
    ),
    path(
        "/<uuid:id>",
        FeatureRepositoryDetailView.as_view(),
        name="feature_repository_detail",
    ),
    path(
        "/<uuid:id>/upload",
        UploadFeatureAndGroups.as_view(),
        name="upload_feature_and_feature_groups",
    ),
]
