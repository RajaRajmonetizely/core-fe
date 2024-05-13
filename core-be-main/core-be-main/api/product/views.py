import json

from django.db.models import F
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError

from api.utils.logger import logger
from .models import Product, ProductAuditHistory
from .serializers import ProductCreateSerializer, ProductSerializer
from ..auth.authentication import CognitoAuthentication
from ..feature_repository.models import FeatureRepository
from ..pricebook.models import PriceBookEntry
from ..pricing_calculator.models import QuoteDetails
from ..tenant.models import Tenant
from ..user.utils import get_tenant_id_from_email, get_user_obj_from_email
from ..utils.custom_exception_handler import (
    ProductAlreadyExistsException,
    ProductDoesNotExistsException,
    ProductAssociatedWithRepository,
    ProductAssociatedWithQuote,
)
from ..utils.responses import ResponseBuilder


class ProductViewSet(viewsets.ModelViewSet):
    authentication_classes = [CognitoAuthentication]

    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    http_method_names = ["get", "post", "put", "delete"]

    def list(self, request, *args, **kwargs):
        logger.info("Getting List of Products")
        tenant_id = get_tenant_id_from_email(request.user[0])
        result_set = Product.objects.filter(
            is_deleted=False, tenant_id=tenant_id
        ).order_by(F("created_on").desc())
        serializer = self.get_serializer_class()
        products = serializer(result_set, many=True).data
        all_products = [
            {"name": prod["name"], "id": prod["id"], "description": prod["description"]}
            for prod in products
        ]
        return ResponseBuilder.success(
            data=all_products, status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, idn=None, *args, **kwargs):
        logger.info("Getting product Info")
        request.data.update({"tenant_id": get_tenant_id_from_email(request.user[0])})
        response = super(ProductViewSet, self).retrieve(request, *args, **kwargs)
        product_data = response.data
        return ResponseBuilder.success(
            data=product_data, status_code=response.status_code
        )

    @swagger_auto_schema(request_body=ProductCreateSerializer)
    def create(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        request.data.update({"tenant_id": tenant_id})
        # Check if a product with the same name already exists
        existing_product = Product.objects.filter(
            tenant_id=tenant_id, name=request.data.get("name"), is_deleted=False
        ).first()
        if existing_product:
            logger.error("A product with the same name already exists.")
            raise ProductAlreadyExistsException(
                "A product with the same name already exists."
            )
        try:
            response = super(ProductViewSet, self).create(request, *args, **kwargs)
        except ValidationError as e:
            logger.error(e.detail)
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )
        product_data = response.data

        # check for user impersonation
        if request.auth and request.auth[0]:
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            product_obj = Product.objects.get(
                id=product_data.get("id"), is_deleted=False
            )
            ProductAuditHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Creating a new Product",
                tenant_id=tenant_obj,
                product_id=product_obj,
                details=json.dumps(
                    {
                        "new_data": {
                            "name": request.data.get("name"),
                            "description": request.data.get("description"),
                        }
                    }
                ),
            )
        return ResponseBuilder.success(
            data=product_data,
            status_code=response.status_code,
        )

    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        previous_data = dict(name=instance.name, description=instance.description)
        if not instance:
            logger.error("Product not found")
            raise ProductDoesNotExistsException("Product not found")
            # Check if a product with the same name already exists
        existing_product = Product.objects.filter(
            tenant_id=tenant_id, name=request.data.get("name"), is_deleted=False
        ).first()
        if existing_product and existing_product.id != instance.id:
            logger.error("A product with the same name already exists.")
            raise ProductAlreadyExistsException(
                "A product with the same name already exists."
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            logger.error(e.detail)
            return ResponseBuilder.errors(
                message=e.detail, status_code=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)
        data = serializer.data

        # check for user impersonation
        if request.auth and request.auth[0]:
            logger.info("this request is for user impersonation")
            tenant_id = get_tenant_id_from_email(request.user[0])
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            ProductAuditHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description="Update Product",
                tenant_id=tenant_obj,
                product_id=instance,
                details=json.dumps(
                    {
                        "new_data": {
                            "name": request.data.get("name"),
                            "description": request.data.get("description"),
                        },
                        "previous_data": previous_data,
                    }
                ),
            )
        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    def destroy(self, request, idn=None, *args, **kwargs):
        product = self.get_object()
        if self.check_product_repository_mapping(product.id, product.tenant_id):
            raise ProductAssociatedWithRepository(
                "Unable to delete the product as it is associated with the repository"
            )
        if self.check_product_quote_mapping(product.id, product.tenant_id):
            raise ProductAssociatedWithQuote(
                "Unable to delete the product as it is associated with the quote"
            )
        if self.check_product_price_book_mapping(product.id, product.tenant_id):
            raise ProductAssociatedWithQuote(
                "Unable to delete the product as it is associated with the price book"
            )
        product.is_deleted = True
        product.save()
        return ResponseBuilder.success(
            data={"id": product.id, "name": product.name},
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def check_product_repository_mapping(product_id, tenant_id):
        return FeatureRepository.objects.filter(
            product_id=product_id, tenant_id=tenant_id, is_deleted=False
        )

    @staticmethod
    def check_product_quote_mapping(product_id, tenant_id):
        return QuoteDetails.objects.filter(
            product_id=product_id, tenant_id=tenant_id, is_deleted=False
        )

    @staticmethod
    def check_product_price_book_mapping(product_id, tenant_id):
        return PriceBookEntry.objects.filter(
            product_id=product_id, tenant_id=tenant_id, is_deleted=False
        )
