import os
from pathlib import Path

from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.pricebook.models import PriceBookDiscountPolicy
from api.pricing_calculator.constants import QuoteStatus, SENDER, FROM_STR, QUOTE_URL
from api.pricing_calculator.models import Quote
from api.pricing_calculator.serializers.quote import PricingCalcSerializer, QuoteApprovalSerializer
from api.user.models import User, UserRoleMapping, UserRole
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import InvalidQuoteStatusException, \
    QuoteDoesNotExistsException, ManagerNotFoundException, ManagerDoesNotHaveQuoteApprovalPermissionException
from api.utils.logger import logger
from api.utils.notifications.send_notification import Notifications
from api.utils.responses import ResponseBuilder


class QuoteApprovalView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=QuoteApprovalSerializer)
    def put(self, request, id):
        data = request.data
        quote_status = data.get('status')

        if quote_status not in (QuoteStatus.ESCALATE_FOR_APPROVAL, QuoteStatus.APPROVED):
            logger.error(f'quote status should be either '
                         f'{QuoteStatus.ESCALATE_FOR_APPROVAL} or {QuoteStatus.APPROVED}')
            raise InvalidQuoteStatusException("Invalid Quote Status")

        tenant_id = get_tenant_id_from_email(request.user[0])

        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        if quote_status == QuoteStatus.APPROVED:
            logger.info(f'quote status is - {quote_status}')
            payload = {
                'sender': SENDER,
                'cc_addr': [],
                'from_str': FROM_STR,
                'data': {'user_name': quote_obj.user_id.name,
                         'quote_url': QUOTE_URL.format(id)},
                'to_addr': [quote_obj.user_id.email],
                'subject': 'Quote Approval Confirmation'
            }
            quote_obj.status = quote_status
            quote_obj.save()
            # Send email notification using Notifications class
            template_path = os.path.join(os.path.abspath(Path(__file__).parent.parent),
                                         'templates')
            Notifications(template_path, 'quote_approved.html',
                          payload).send_email_notification()

            return ResponseBuilder.success(
                data={"message": "Quote Approved", "assigned_to": quote_obj.assigned_to.id},
                status_code=status.HTTP_200_OK)

        if quote_status == QuoteStatus.ESCALATE_FOR_APPROVAL:
            logger.info(f'quote status is - {quote_status}')

            price_book_id = quote_obj.price_book_id.id
            price_book_discount_details = PriceBookDiscountPolicy.objects.filter(
                price_book_id=price_book_id, tenant_id=tenant_id, is_deleted=False)
            if not price_book_discount_details:
                return ResponseBuilder.errors(
                    data="Discount policy not set for selected price book",
                    status_code=status.HTTP_400_BAD_REQUEST)

            user_obj = User.objects.get(email=request.user[0], is_deleted=False)

            manager_obj = user_obj.manager_id
            if not manager_obj:
                raise ManagerNotFoundException("Manager not assigned to the logged user")
            manager_id = manager_obj.id

            quote_approval_role_obj = UserRole.objects.get(name='Quote Approval', is_deleted=False,
                                                           tenant_id=tenant_id)
            is_allow_for_approval, is_approval_discount_allowed, manager_user_obj = is_quote_approval_allowed(
                manager_id, quote_approval_role_obj, price_book_discount_details, data)
            logger.info(f'is_allowed for quote approval - {is_allow_for_approval}')

            if is_allow_for_approval and manager_user_obj:
                payload = {
                    'sender': SENDER,
                    'cc_addr': [],
                    'from_str': FROM_STR,
                    'data': {'user_name': manager_user_obj.name,
                             'quote_url': QUOTE_URL.format(id)},
                    'to_addr': [manager_user_obj.email],
                    'subject': 'Quote Approval Notification'
                }
                quote_obj.status = quote_status
                quote_obj.assigned_to = manager_user_obj
                quote_obj.save()
                # Send email notification using Notifications class
                template_path = os.path.join(os.path.abspath(Path(__file__).parent.parent),
                                             'templates')
                Notifications(template_path, 'escalated_for_approval.html',
                              payload).send_email_notification()

                return ResponseBuilder.success(
                    data={"message": "Quote Escalated for Approval",
                          "assigned_to": quote_obj.assigned_to.id},
                    status_code=status.HTTP_200_OK)
            elif not is_approval_discount_allowed:
                return ResponseBuilder.errors(
                    message="Manager(s) can not approve the escalated Quote as "
                            "total discount is more than allowed discount",
                    status_code=status.HTTP_400_BAD_REQUEST)
            else:
                return ResponseBuilder.errors(
                    message="Quote can not be approved, please check all the approval configuration",
                    status_code=status.HTTP_400_BAD_REQUEST)


def is_quote_approval_allowed(manager_id, quote_approval_role_obj, price_book_discount_details, data):
    user_role_obj = UserRoleMapping.objects.filter(
        user_id=manager_id, user_role_id=quote_approval_role_obj.id, is_deleted=False)
    manager_user_obj = User.objects.get(id=manager_id, is_deleted=False)
    is_allow_for_approval = False
    is_approval_discount_allowed = False

    if not user_role_obj:
        logger.error('Manager does not have quote approval role')
        raise ManagerDoesNotHaveQuoteApprovalPermissionException('Manager does not have quote approval role')
    else:
        org_hierarchy_id = str(manager_user_obj.org_hierarchy_id.id)
        discount_policy = price_book_discount_details[0]
        details = discount_policy.details

        allowed_discount = {}
        for item in details:
            for role_item in item.get('org_hierarchy', []):
                if org_hierarchy_id == role_item.get('org_hierarchy_id'):
                    allowed_discount[item.get('product_id')] = role_item.get('discount')

        original_list = data.get('details')
        for item in original_list:
            product_id = item.get('product_id')
            discount = item.get('discount')
            if (allowed_discount.get(product_id) and
                    float(allowed_discount.get(product_id)) >= float(discount)):
                is_allow_for_approval = True
                is_approval_discount_allowed = True
            else:
                is_allow_for_approval = False
                is_approval_discount_allowed = False
    return is_allow_for_approval, is_approval_discount_allowed, manager_user_obj
