from api.test.conftest import MonetizelyProductAPIClient
from api.test.constants import PRODUCT


class TestProductViews(MonetizelyProductAPIClient):
    def test_add_product(self):
        new_product = self.create_product(payload=PRODUCT)
        self.assertEqual(new_product.status_code, 201)
        self.assertEqual(new_product.data["name"], PRODUCT["name"])


class TestRetrieveUpdateDeleteProductViews(MonetizelyProductAPIClient):
    def test_update_product_data(self):
        new_product = self.create_product(payload=PRODUCT)
        product_id = new_product.data["id"]

        updated_product_data = {
            "name": "Updated Dummy Product",
            "description": "Updating description of Dummy Product",
        }
        updated_product = self.update_product(product_id, payload=updated_product_data)

        self.assertEqual(updated_product.status_code, 200)
        self.assertEqual(updated_product.data["id"], product_id)
        self.assertNotEqual(updated_product.data["name"], new_product.data["name"])
