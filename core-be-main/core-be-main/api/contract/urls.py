from django.urls import path

from .views.contract import ContractViewSet
from .views.contract_config import ContractSpecificConfig
from .views.send_contract_for_sign import (
    ContractEventView,
    ContractRemoveView,
    ContractView, ContractDownloadView,
)

urlpatterns = [
    path(
        "/specific_config",
        ContractSpecificConfig.as_view({"get": "retrieve", "put": "update"}),
        name="contract_specific_config",
    ),
    path(
        "/<str:id>/signature_request",
        ContractView.as_view(),
        name="send-contract-for-signature",
    ),
    path(
        "/event",
        ContractEventView.as_view(),
        name="event-type-callback-from-hello-sign",
    ),
    path(
        "/<str:id>/signature_request/cancel",
        ContractRemoveView.as_view(),
        name="cancel-signature-request-access",
    ),
    path(
        "/<str:id>/signature_request/download",
        ContractDownloadView.as_view(),
        name="cancel-signature-request-access",
    ),
    path("", ContractViewSet.as_view({"post": "create"}), name="contract_creation"),
    path(
        "/<str:id>", ContractViewSet.as_view({"get": "retrieve"}), name="contract_get"
    ),
]
