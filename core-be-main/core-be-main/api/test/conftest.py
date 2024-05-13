from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from api.product.models import Product

from .constants import PRODUCT_POST_URL, PRODUCT_PUT_URL


class BaseTest(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()


class MonetizelyProductAPIClient(BaseTest):
    def create_product(self, payload):
        url = reverse(PRODUCT_POST_URL)
        response = self.client.post(url, data=payload)
        return response

    def update_product(self, id, payload):
        url = reverse(PRODUCT_PUT_URL, args=[id])
        response = self.client.put(url, payload)
        return response
