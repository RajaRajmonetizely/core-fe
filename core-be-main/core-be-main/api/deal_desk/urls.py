from django.urls import path

from api.deal_desk.views import DealDeskViewSet

urlpatterns = [
    path("deal_desk", DealDeskViewSet.as_view({"get": "list"})),
]
