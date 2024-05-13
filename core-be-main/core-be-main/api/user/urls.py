from django.urls import path

from .views import (
    OrgHierarchyCreateView,
    OrgHierarchyFromCSVView,
    OrgHierarchyStructureView,
    OrgHierarchyView,
    UserCreateFromCSVView,
    UserFromCSVView,
    UserListView,
    UserRoleCreateView,
    UserRoleFromCSVView,
    UserRoleView,
    UserViewSet,
)
from .views.user_profile import UserProfileView
from .views.user_settings import UserSettingView

urlpatterns = [
    path("/org_hierarchy", OrgHierarchyCreateView.as_view(), name="org-hierarchy"),
    path(
        "/org_hierarchy/structure",
        OrgHierarchyStructureView.as_view(),
        name="org-heirarchy-stucture",
    ),
    path(
        "/org_hierarchy/csv",
        OrgHierarchyFromCSVView.as_view(),
        name="org-heirarchy-stucture-csv",
    ),
    path(
        "/org_hierarchy/<str:id>", OrgHierarchyView.as_view(), name="org-hierarchy-view"
    ),
    path("/role/csv", UserRoleFromCSVView.as_view(), name="user-role-csv"),
    path("/role", UserRoleCreateView.as_view(), name="user-role-create"),
    path("/role/<str:id>", UserRoleView.as_view(), name="user-role"),
    path("/csv", UserFromCSVView.as_view(), name="user-csv"),
    path("/setting", UserSettingView.as_view(), name="users-setting"),
    path("/profile", UserProfileView.as_view(), name="users-profile"),
    path("/create_from_csv", UserCreateFromCSVView.as_view(), name="user-create-csv"),
    path("/all/users", UserListView.as_view({"get": "list"})),
    path('', UserViewSet.as_view({"post": "create"})),
    path('/<str:id>', UserViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}))
]
