import os
from pathlib import Path

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.auth.authentication import CognitoAuthentication
from api.pricebook.models import PriceBookDiscountPolicy
from api.pricing_calculator.constants import QuoteStatus, SENDER, FROM_STR, QUOTE_URL
from api.pricing_calculator.models import Quote
from api.pricing_calculator.serializers.quote import PricingCalcSerializer
from api.user.models import UserRole, UserRoleMapping
from api.user.utils import get_tenant_id_from_email
from api.utils.custom_exception_handler import QuoteDoesNotExistsException
from api.utils.logger import logger
from api.utils.notifications.send_notification import Notifications
from api.utils.responses import ResponseBuilder


class QuoteForwardView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        price_book_discount_details = PriceBookDiscountPolicy.objects.filter(
            price_book_id=quote_obj.price_book_id.id, tenant_id=tenant_id, is_deleted=False)
        if not price_book_discount_details:
            return ResponseBuilder.errors(
                message="Discount policy not set for selected price book",
                status_code=status.HTTP_400_BAD_REQUEST)

        quote_approval_role_obj = UserRole.objects.get(
            name='Quote Approval', is_deleted=False, tenant_id=tenant_id)
        if quote_approval_role_obj:
            quote_dd_role_obj = UserRole.objects.get(
                name='Deal Desk', is_deleted=False, tenant_id=tenant_id)
            user_role_obj = UserRoleMapping.objects.filter(user_role_id=quote_dd_role_obj.id,
                                                           is_deleted=False)
            if user_role_obj:
                quote_obj.assigned_to = user_role_obj[0].user_id
                quote_obj.status = QuoteStatus.FORWARD_TO_DD
                quote_obj.save()
                to_addr = [user_obj.user_id.email for user_obj in user_role_obj]
                payload = {
                    'sender': SENDER,
                    'cc_addr': [],
                    'from_str': FROM_STR,
                    'data': {'user_name': user_role_obj[0].user_id.name,
                             'quote_url': QUOTE_URL.format(id)},
                    'to_addr': to_addr,
                    'subject': 'Quote Approval Notification'
                }
                # Send email notification using Notifications class
                template_path = os.path.join(os.path.abspath(Path(__file__).parent.parent),
                                             'templates')
                Notifications(template_path, 'forward_to_dd.html',
                              payload).send_email_notification()
                return ResponseBuilder.success(
                    data={"message": "Quote forwarded to Deal Desk",
                          "assigned_to": quote_obj.assigned_to.id},
                    status_code=status.HTTP_200_OK
                )
            else:
                logger.info('Quote Approval role is not assigned to any user')
                return ResponseBuilder.errors(
                    message="You can't forward to deal desk as there is no user with Deal Desk role in the tenant",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        logger.info('Quote Approval role is not available')
        return ResponseBuilder.errors(
            message="You can't forward to deal desk as quote approval role is not in the tenant",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class QuoteResendView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def put(request, id):
        logger.info('resend quote back to AE')
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        quote_obj.status = QuoteStatus.DRAFT
        quote_obj.assigned_to = quote_obj.user_id
        quote_obj.save()
        payload = {
            'sender': SENDER,
            'cc_addr': [],
            'from_str': FROM_STR,
            'data': {'user_name': quote_obj.user_id.name,
                     'quote_url': QUOTE_URL.format(id)},
            'to_addr': [quote_obj.user_id.email],
            'subject': 'Quote Assignment Notification'
        }
        # Send email notification using Notifications class
        template_path = os.path.join(os.path.abspath(Path(__file__).parent.parent), 'templates')
        Notifications(template_path, 'resend_quote.html', payload).send_email_notification()
        return ResponseBuilder.success(
            data={"message": "Quote is sent back to AE",
                  "assigned_to": quote_obj.assigned_to.id},
            status_code=status.HTTP_200_OK
        )


class QuoteStatusView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "status",
                openapi.IN_QUERY,
                description="Quote Status",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=True,
            ),
        ],
    )
    def put(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")
        quote_status = request.query_params.get("status")
        quote_obj.status = quote_status
        quote_obj.save()
        return ResponseBuilder.success(
            data="Quote Status updated", status_code=status.HTTP_200_OK
        )
