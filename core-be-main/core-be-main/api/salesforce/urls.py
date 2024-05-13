from django.urls import path

from api.salesforce.views.salesforce import SFUserRoleView
from api.salesforce.views.salesforce_connector import SFConnector
from api.salesforce.views.salesforce_sync import SalesforceSync
from api.salesforce.views.sforce_mapping import SFMapping, SFMappingDetail, SFMappingObjects

urlpatterns = [
    # path("salesforce/account", SFAccountView.as_view(), name="salesforce-account"),
    # path("salesforce/opportunity", SFOpportunityView.as_view(), name="salesforce-opportunity"),
    path("salesforce/mapping/objects", SFMappingObjects.as_view()),
    path("salesforce/mapping", SFMapping.as_view(), name="salesforce-mapping"),
    path(
        "salesforce/mapping/<str:id>",
        SFMappingDetail.as_view(),
        name="salesforce-mapping-detail",
    ),
    path("salesforce/connector", SFConnector.as_view(), name="salesforce-connector"),
    path("salesforce/sync", SalesforceSync.as_view(), name="salesforce-sync"),
    path("salesforce/user_role", SFUserRoleView.as_view())
]
