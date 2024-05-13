from django.urls import path

from api.rbac.views.features import FeaturesView
from api.rbac.views.rbac import RbacView
from api.rbac.views.user_role import RbacUserRoleView

urlpatterns = [
    path("/operations", RbacView.as_view(), name="rbac"),
    path("/features", FeaturesView.as_view(), name="features"),
    path("/role", RbacUserRoleView.as_view(), name="rbac-roles")
]
