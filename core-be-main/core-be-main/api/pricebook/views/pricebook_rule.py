import json
import uuid

from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from api.auth.authentication import CognitoAuthentication
from api.pricebook.models import PriceBookRule, PriceBookRuleHistory
from api.pricebook.serializers.pricebook_rule import PriceBookRuleSerializer
from api.tenant.models import Tenant
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.common.common_utils import CommonUtils
from api.utils.custom_exception_handler import PriceBookRuleDoesNotExistsException, PriceBookRuleExistsException
from api.utils.responses import ResponseBuilder


class PriceBookRuleViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = PriceBookRule.objects.filter(price_book_id__is_deleted=False).all()
    serializer_class = PriceBookRuleSerializer
    http_method_names = ["get", "put", "delete", "post"]
    related_fields = ['opportunity_type_id', 'user_id', 'price_book_id', 'org_hierarchy_id']

    def get_queryset(self):
        tenant_id = get_tenant_id_from_email(self.request.user[0])
        queryset = self.queryset.filter(is_deleted=False, tenant_id=tenant_id)
        queryset = queryset.order_by(F("created_on").desc())
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        data = []

        for item in queryset:
            serializer = self.get_serializer(item)
            data_dict = serializer.data

            for field_name, field in serializer.fields.items():
                if field.source in PriceBookRuleViewSet.related_fields:
                    related_object = getattr(item, field.source)
                    related_name = related_object.name if related_object else None
                    related_field_name = field.source[:-2] + "name"
                    data_dict[related_field_name] = related_name

            data.append(data_dict)

        return ResponseBuilder.success(data=data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        for field_name, field in serializer.fields.items():
            if field.source in PriceBookRuleViewSet.related_fields:
                related_object = getattr(instance, field.source)
                related_name = related_object.name if related_object else None
                related_field_name = field.source[:-3] + "_name"
                data[related_field_name] = related_name

        return ResponseBuilder.success(data=data)

    def create(self, request, *args, **kwargs):
        try:
            tenant_id = get_tenant_id_from_email(request.user[0])
            request.data.update({"tenant_id": tenant_id})
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Check if both user_id and org_hierarchy_id are provided
            user_id = serializer.validated_data.get("user_id")
            org_hierarchy_id = serializer.validated_data.get("org_hierarchy_id")
            price_book_id = serializer.validated_data.get("price_book_id")
            opportunity_type_id = serializer.validated_data.get("opportunity_type_id")
            if user_id and org_hierarchy_id:
                return ResponseBuilder.errors(
                    message="Both user_id and org_hierarchy_id cannot be provided at the same time.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            if not price_book_id and not opportunity_type_id:
                return ResponseBuilder.errors(
                    message="Both PriceBook and Opportunity Type are mandatory.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            elif not price_book_id:
                return ResponseBuilder.errors(
                    message="Pricebook is mandatory.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            elif not opportunity_type_id:
                return ResponseBuilder.errors(
                    message="Opportunity Type is mandatory.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            self.price_book_rule_validation(tenant_id, user_id, price_book_id, opportunity_type_id, org_hierarchy_id)

            self.perform_create(serializer)

            instance = serializer.instance
            data = serializer.data

            for field_name, field in serializer.fields.items():
                if field.source in PriceBookRuleViewSet.related_fields:
                    related_object = getattr(instance, field.source)
                    related_name = related_object.name if related_object else None
                    related_field_name = field.source[:-3] + "_name"
                    data[related_field_name] = related_name

            try:
                if request.auth and request.auth[0]:
                    tenant_id = get_tenant_id_from_email(request.user[0])
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    # Create PriceBookRuleHistory entry
                    pricebook_rule_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_rule_id": instance,
                        "description": "Creating a PriceBookRule",
                        "details": json.dumps({
                            "new_data": CommonUtils.convert_uuids_to_strings(data),
                        }),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookRuleHistory.objects.create(**pricebook_rule_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return ResponseBuilder.success(data=data, status_code=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseBuilder.errors(message=e.detail, status_code=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def price_book_rule_validation(tenant_id, user_id, price_book_id, opportunity_type_id, org_hierarchy_id):
        price_book_rule_obj = PriceBookRule.objects.filter(
            price_book_id=price_book_id.id,
            opportunity_type_id=opportunity_type_id.id, is_deleted=False, tenant_id=tenant_id)
        if user_id:
            price_book_rule_obj = price_book_rule_obj.filter(user_id=user_id.id)
        if org_hierarchy_id:
            price_book_rule_obj = price_book_rule_obj.filter(org_hierarchy_id=org_hierarchy_id.id)
        if price_book_rule_obj:
            raise PriceBookRuleExistsException('Pricebook rule already exists')

    def update(self, request, *args, **kwargs):
        tenant_id = get_tenant_id_from_email(request.user[0])
        instance = self.get_object()
        previous_data = PriceBookRuleSerializer(instance).data
        if not instance:
            raise PriceBookRuleDoesNotExistsException("PriceBookRule not found")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get("user_id")
        org_hierarchy_id = serializer.validated_data.get("org_hierarchy_id")

        if user_id is not None and org_hierarchy_id is not None:
            return ResponseBuilder.errors(
                message="You cannot provide both User and Designation at the same time. Please choose one.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        opportunity_type_id = serializer.validated_data.get("opportunity_type_id")
        pricebook_id = serializer.validated_data.get("price_book_id")

        if opportunity_type_id is None:
            return ResponseBuilder.errors(
                message="Opportunity Type is mandatory.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if pricebook_id is None:
            return ResponseBuilder.errors(
                message="Pricebook is mandatory.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        self.price_book_rule_validation(tenant_id, user_id, pricebook_id, opportunity_type_id, org_hierarchy_id)

        with transaction.atomic():
            self.perform_update(serializer)

            instance = serializer.instance
            data = serializer.data

            for field_name, field in serializer.fields.items():
                if field.source in PriceBookRuleViewSet.related_fields:
                    related_object = getattr(instance, field.source)
                    related_name = related_object.name if related_object else None
                    related_field_name = field.source[:-3] + "_name"
                    data[related_field_name] = related_name

            try:
                if request.auth and request.auth[0]:
                    tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                    # Create PriceBookRuleHistory entry
                    pricebook_rule_history_data = {
                        "admin_user_id": request.auth[1],
                        "user_id": get_user_obj_from_email(request.user[0]),
                        "pricebook_rule_id": instance,
                        "description": "Updating a PriceBookRule",
                        "details": json.dumps({
                            "new_data": CommonUtils.convert_uuids_to_strings(data),
                            "previous_data": CommonUtils.convert_uuids_to_strings(previous_data),
                        }),
                        "tenant_id": tenant_obj,
                    }
                    PriceBookRuleHistory.objects.create(**pricebook_rule_history_data)

            except Exception as e:
                return ResponseBuilder.errors(
                    message="Error creating audit history entry: " + str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        return ResponseBuilder.success(data=data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            raise PriceBookRuleDoesNotExistsException("PriceBookRule not found")

        instance.is_deleted = True
        instance.save()

        try:
            if request.auth and request.auth[0]:
                tenant_id = get_tenant_id_from_email(request.user[0])
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)

                # Create PriceBookRuleHistory entry for deletion
                pricebook_rule_history_data = {
                    "admin_user_id": request.auth[1],
                    "user_id": get_user_obj_from_email(request.user[0]),
                    "pricebook_rule_id": instance,
                    "description": "Deleting a PriceBookRule",
                    "details": json.dumps({}),
                    "tenant_id": tenant_obj,
                }
                PriceBookRuleHistory.objects.create(**pricebook_rule_history_data)

        except Exception as e:
            return ResponseBuilder.errors(
                message="Error creating audit history entry: " + str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return ResponseBuilder.success(status_code=status.HTTP_200_OK)
