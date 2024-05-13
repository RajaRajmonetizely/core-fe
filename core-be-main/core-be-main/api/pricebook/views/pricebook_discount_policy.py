import json
import uuid

from django.db import transaction
from django.db.models import F
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.pricebook.models import PriceBook, PriceBookDiscountPolicy, PriceBookDiscountPolicyHistory
from api.pricebook.serializers.pricebook_discount_policy import (
    PriceBookDiscountPolicySerializer,
)
from api.product.models import Product
from api.tenant.models import Tenant
from api.user.models import User, OrgHierarchy
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import PriceBookDoesNotExistsException
from api.utils.responses import ResponseBuilder


class PriceBookDiscountPolicyViewSet(viewsets.ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = PriceBookDiscountPolicy.objects.all()
    serializer_class = PriceBookDiscountPolicySerializer

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "details": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "product_id": openapi.Schema(
                                type=openapi.TYPE_STRING,
                            ),
                            "org_hierarchy": openapi.Schema(
                                type=openapi.TYPE_ARRAY,
                                items=openapi.Schema(
                                    type=openapi.TYPE_OBJECT,
                                    properties={
                                        "org_hierarchy_id": openapi.Schema(
                                            type=openapi.TYPE_STRING,
                                        ),
                                        "discount": openapi.Schema(
                                            type=openapi.TYPE_STRING,
                                        ),
                                    },
                                ),
                            ),
                        },
                    ),
                )
            },
        )
    )
    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        price_book_id = kwargs.get("pk")
        previous_data = None

        discount_policy = PriceBookDiscountPolicy.objects.filter(
            price_book_id=price_book_id, is_deleted=False, tenant_id=tenant_id
        ).first()

        details = [
            {"product_id": item["product_id"], "org_hierarchy": item["org_hierarchy"]}
            for item in request.data["details"]
        ]

        request_data = {
            "details": details,
            "tenant_id": tenant_id,
            "price_book_id": price_book_id
        }

        serializer = self.get_serializer(discount_policy, data=request_data)
        with transaction.atomic():
            if discount_policy is None:
                serializer = self.get_serializer(data=request_data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                new_data = serializer.data
                description = "Creating a PriceBookDiscountPolicy"
            else:
                previous_data = PriceBookDiscountPolicySerializer(discount_policy).data
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                new_data = serializer.data
                description = "Updating a PriceBookDiscountPolicy"

            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                    pricebook_policy_obj = PriceBookDiscountPolicy.objects.get(id=serializer.data["id"],
                                                                               is_deleted=False)
                    new_data = CommonUtils.convert_uuids_to_strings(new_data)
                    if previous_data:
                        previous_data = CommonUtils.convert_uuids_to_strings(previous_data)

                    # Create PriceBookDiscountPolicyHistory entry
                    policy_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_policy_id": pricebook_policy_obj,
                        "description": description,
                        "details": json.dumps({
                            "new_data": new_data,
                            "previous_data": previous_data if discount_policy else None,
                        }) if discount_policy else json.dumps({"new_data": new_data}),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookDiscountPolicyHistory.objects.create(**policy_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        return ResponseBuilder.success(data=serializer.data, status_code=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        price_book_id = kwargs.get("pk")
        discount_policies = PriceBookDiscountPolicy.objects.filter(
            price_book_id=price_book_id, is_deleted=False, tenant_id=tenant_id
        ).order_by(F("created_on").desc())

        serializer = self.get_serializer(discount_policies, many=True)
        data = serializer.data
        # Collect price book name [Could be removed if not needed]
        price_book_name = PriceBook.objects.get(
            id=price_book_id, is_deleted=False, tenant_id=tenant_id).name

        # Collect all unique org_hierarchy IDs and product IDs
        org_hierarchy_ids = set()
        product_ids = set()
        for item in data:
            for product in item["details"]:
                org_hierarchy_items = product.get("org_hierarchy", [])
                org_hierarchy_ids.update(
                    [org_item.get("org_hierarchy_id") for org_item in org_hierarchy_items])
                product_ids.add(product.get("product_id"))

        # Retrieve org_hierarchy names
        org_hierarchy_names = OrgHierarchy.objects.filter(
            id__in=org_hierarchy_ids, is_deleted=False, tenant_id=tenant_id
        ).values("id", "name")

        # Create a mapping dictionary based on database IDs
        org_hierarchy_name_mapping = {str(item["id"]): item["name"] for item in org_hierarchy_names}
        # Retrieve product names and create mapping
        product_names = Product.objects.filter(
            id__in=product_ids, is_deleted=False, tenant_id=tenant_id
        ).values("id", "name")
        product_name_mapping = {str(item["id"]): item["name"] for item in product_names}

        # Update data with org_hierarchy names and product names
        for item in data:
            item["price_book_name"] = price_book_name
            for product in item["details"]:
                org_hierarchy_items = product.get("org_hierarchy", [])
                for org_item in org_hierarchy_items:
                    org_hierarchy_id = org_item.get("org_hierarchy_id")
                    org_hierarchy_name = org_hierarchy_name_mapping.get(org_hierarchy_id)
                    if org_hierarchy_name:
                        org_item["name"] = org_hierarchy_name

                product_id = product.get("product_id")
                product_name = product_name_mapping.get(product_id)
                product["name"] = product_name

        return ResponseBuilder.success(data=data)

    def destroy(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        price_book_id = kwargs.get("pk")

        discount_policies = PriceBookDiscountPolicy.objects.get(
            price_book_id=price_book_id, is_deleted=False, tenant_id=tenant_id
        )

        with transaction.atomic():
            discount_policies.is_deleted = True
            discount_policies.save()

            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    # Create PriceBookDiscountPolicyHistory entries for each deleted policy
                    policy_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_policy_id": discount_policies,
                        "description": "Deleting a PriceBookDiscountPolicy",
                        "details": json.dumps({}),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookDiscountPolicyHistory.objects.create(**policy_history_data)

            except Exception as e:
                transaction.set_rollback(True)
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        return ResponseBuilder.success(status_code=status.HTTP_200_OK)


class PriceBookUserDiscountView(APIView):
    authentication_classes = [CognitoAuthentication]

    def get(self, request, id):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        price_book = PriceBook.objects.filter(id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not price_book:
            raise PriceBookDoesNotExistsException("PriceBook Does Not Exist")

        price_book_discount_details = PriceBookDiscountPolicy.objects.filter(
            price_book_id=id, tenant_id=tenant_id, is_deleted=False)
        if not price_book_discount_details:
            return ResponseBuilder.success(
                data=[], status_code=status.HTTP_200_OK)

        user_obj = User.objects.get(email=request.user[0], is_deleted=False)
        response = []

        org_hierarchy_obj = user_obj.org_hierarchy_id
        if not org_hierarchy_obj:
            return ResponseBuilder.success(
                message='User is not assigned in any org hierarchy',
                data=response, status_code=status.HTTP_200_OK
            )

        org_hierarchy_id = str(user_obj.org_hierarchy_id.id)
        discount_policy = price_book_discount_details[0]
        details = discount_policy.details

        for item in details:
            data = {'product_id': item.get('product_id')}
            product_obj = Product.objects.get(
                id=item.get('product_id'), tenant_id=tenant_id, is_deleted=False)
            data['product_name'] = product_obj.name
            for role_item in item.get('org_hierarchy', []):
                if org_hierarchy_id == role_item.get('org_hierarchy_id'):
                    data['discount'] = role_item.get('discount')
            response.append(data)
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)
