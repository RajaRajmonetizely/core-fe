import json
import os
from datetime import date

from dateutil.relativedelta import relativedelta
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.account.models import Opportunity, Account
from api.auth.authentication import CognitoAuthentication
from api.feature_repository.models import Feature
from api.plan.models import Tier
from api.pricebook.models import PriceBook
from api.pricing_calculator.constants import QuoteStatus
from api.pricing_calculator.models import Quote, QuoteDetails, QuoteNote, QuoteHistory
from api.pricing_calculator.serializers.quote import (
    PricingCalcSerializer,
    CreateQuoteSerializer,
    QuoteCommentSerializer,
    CreateQuoteCommentSerializer,
)
from api.product.models import Product
from api.tenant.models import Tenant
from api.user.models import User
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.custom_exception_handler import QuoteDoesNotExistsException, \
    OpportunityDoesNotExistsException, AccountDoesNotExistsException, \
    PriceBookDoesNotExistsException, InvalidQuoteStatusException, ProductDoesNotExistsException, \
    TierDoesNotExistsException, QuoteAssociatedWithContractException
from api.utils.logger import logger
from api.utils.responses import ResponseBuilder


class PricingCalculatorView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "price_book_id",
                openapi.IN_QUERY,
                description="Get all the quotes for the given price book ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,  # Not required since we allow opportunity_id to be sent instead
            ),
            openapi.Parameter(
                "opportunity_id",
                openapi.IN_QUERY,
                description="Get all the quotes for the given opportunity ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,  # Not required since we allow price_book_id to be sent instead
            ),
        ]
    )
    def get(self, request):
        price_book_id = request.query_params.get("price_book_id")
        opportunity_id = request.query_params.get("opportunity_id")
        tenant_id = get_tenant_id_from_email(request.user[0])

        if not price_book_id and not opportunity_id:
            logger.error("at least one of 'price_book_id' or 'opportunity_id' must be provided")
            return ResponseBuilder.errors(
                message="At least one of 'price_book_id' or 'opportunity_id' must be provided.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        quote_query_set = Quote.objects.filter(is_deleted=False, tenant_id=tenant_id)

        if price_book_id:
            try:
                _ = PriceBook.objects.get(
                    id=price_book_id, is_deleted=False, tenant_id=tenant_id
                )
            except PriceBook.DoesNotExist:
                logger.error(f"price book does not exist for given id - {price_book_id}")
                return ResponseBuilder.errors(
                    message="PriceBook Does Not Exist",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            quote_query_set = quote_query_set.filter(price_book_id=price_book_id)

        if opportunity_id:
            quote_query_set = quote_query_set.filter(opportunity_id=opportunity_id)

        response = [
            {
                "id": item.id,
                "name": item.name,
                "opportunity_id": item.opportunity_id.id,
                "opportunity_name": item.opportunity_id.name,
            }
            for item in quote_query_set
        ]
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    @swagger_auto_schema(
        request_body=CreateQuoteSerializer,
        manual_parameters=[
            openapi.Parameter(
                "id",
                openapi.IN_QUERY,
                description="Quote ID",
                type=openapi.TYPE_STRING,
                format=openapi.TYPE_STRING,
                required=False,
            ),
        ],
    )
    def put(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        data = request.data
        opportunity_id, price_book_id = data.get("opportunity_id"), data.get("price_book_id")
        opportunity_obj = Opportunity.objects.filter(
            id=opportunity_id, is_deleted=False, tenant_id=tenant_id)
        if not opportunity_obj:
            logger.error(f"opportunity does not exist for given id - {opportunity_id}")
            raise OpportunityDoesNotExistsException("Opportunity Does Not Exist")

        account_obj = Account.objects.filter(
            id=opportunity_obj[0].account_id.id, is_deleted=False, tenant_id=tenant_id)
        if not account_obj:
            logger.error(f"account does not exist for "
                         f"given id - {opportunity_obj[0].account_id.id}")
            raise AccountDoesNotExistsException("Account Does Not Exist")

        price_book_obj = PriceBook.objects.filter(
            id=price_book_id, is_deleted=False, tenant_id=tenant_id)
        if not price_book_obj:
            logger.error(f"price book does not exist for given id - {price_book_id}")
            raise PriceBookDoesNotExistsException("PriceBook Does Not Exist")

        quote_id = request.query_params.get("id")
        quote_obj = None
        if quote_id:
            quote_obj = Quote.objects.filter(id=quote_id, is_deleted=False)
            if not quote_obj:
                logger.error(f"quote does not exist for given id - {quote_id}")
                raise QuoteDoesNotExistsException("Quote Does Not Exist")
            quote_obj = quote_obj[0]

        tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
        columns = data.get("columns")

        if quote_obj:
            if not quote_obj.status == QuoteStatus.DRAFT:
                logger.error('quote status can not be updated as quote not in draft state')
                raise InvalidQuoteStatusException("Quote can not be updated")

            quote_obj.deal_term_details = json.dumps(data.get('deal_term_details'))
            quote_obj.save()

            new_updated_data, old_data = [], []
            for item in data.get("quote_details"):
                for tier in item.get("tiers"):
                    new_data = {}
                    previous_data = {}
                    details = tier.get("details")
                    details["columns"] = columns
                    details["total"] = tier.get("total")

                    quote_details_obj = QuoteDetails.objects.filter(
                        quote_id=quote_id,
                        product_id=item.get("product_id"),
                        tier_id=tier.get("tier_id"),
                        is_deleted=False,
                    )
                    new_data['product_id'] = item.get("product_id")
                    new_data['tier_id'] = tier.get("tier_id")
                    new_data['details'] = details
                    previous_data['product_id'] = item.get("product_id")
                    previous_data['tier_id'] = tier.get("tier_id")
                    if quote_details_obj:
                        previous_data['details'] = quote_details_obj[0].details
                        quote_details_obj[0].details = json.dumps(details)
                        quote_details_obj[0].save()
                    else:
                        product_obj = Product.objects.filter(
                            id=item.get("product_id"), is_deleted=False)
                        if not product_obj:
                            logger.error(f'product does not exist for given id'
                                         f' - {item.get("product_id")}')
                            raise ProductDoesNotExistsException("Product Does Not Exist")

                        tier_obj = Tier.objects.filter(id=tier.get("tier_id"), is_deleted=False)
                        if not tier_obj:
                            logger.error(f'tier does not exist for given id'
                                         f' - {tier.get("tier_id")}')
                            raise TierDoesNotExistsException("Tier Does Not Exist")

                        QuoteDetails.objects.create(
                            quote_id=quote_obj,
                            product_id=product_obj[0],
                            tier_id=tier_obj[0],
                            tenant_id=tenant_obj,
                            details=json.dumps(details),
                        )
                    new_updated_data.append(new_data)
                    old_data.append(previous_data)
            # check for user impersonation
            if request.auth and request.auth[0]:
                logger.info('quote updated - this request is for user impersonation')
                tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
                QuoteHistory.objects.create(
                    admin_user_id=request.auth[1],
                    user_id=get_user_obj_from_email(request.user[0]),
                    description='Quote Updated',
                    tenant_id=tenant_obj,
                    quote_id=quote_obj,
                    details=json.dumps(
                        {'new_data': new_updated_data, 'previous_data': old_data})
                )
            return ResponseBuilder.success(
                data={"message": "Quote updated successfully", "id": quote_obj.id},
                status_code=status.HTTP_200_OK,
            )

        # For "create" operation
        # Calculate the expiration date based on current date and QUOTE_EXPIRATION_DAYS
        expiration_days = int(os.getenv('QUOTE_EXPIRATION_DAYS', default=15))
        current_date = date.today()
        expiration_date = current_date + relativedelta(days=expiration_days)

        # Add the expiration date to the request data if not already present
        if 'expiration_date' not in data:
            data['expiration_date'] = expiration_date.isoformat()

        # Modify the quote_url to include CNAME_BASE_URL and quote ID
        cname_base_url = os.getenv('CNAME_BASE_URL', default='http://example.com')

        # Create quote object
        user_obj = User.objects.get(email=request.user[0], is_deleted=False)
        try:
            quote_obj = Quote.objects.create(
                opportunity_id=opportunity_obj[0],
                price_book_id=price_book_obj[0],
                tenant_id=tenant_obj,
                name=data.get("name"),
                total_price=data.get("total_price"),
                discount=data.get("discount"),
                quote_number=PricingCalculatorView.generate_quote_number(tenant_id),
                account_id=account_obj[0],
                user_id=user_obj,
                assigned_to=user_obj,
                expiration_date=data.get("expiration_date"),
                deal_term_details=json.dumps(data.get('deal_term_details'))
            )
        except Exception as e:
            logger.exception(f"Failed to create quote - {str(e)}")
            return ResponseBuilder.errors(
                message="Failed to create quote",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Update the quote_url with the correct quote_id
        if not data.get('quote_url'):
            quote_obj.quote_url = f"{cname_base_url}/{quote_obj.id}"
        else:
            quote_obj.quote_url = data.get('quote_url')
        quote_obj.save()

        # create quote details object
        for item in data.get("quote_details"):
            for tier in item.get("tiers"):
                details = tier.get("details")
                details["columns"] = columns
                details["total"] = tier.get("total")

                product_obj = Product.objects.filter(id=item.get("product_id"), is_deleted=False)
                if not product_obj:
                    logger.error(f'product does not exist for given id'
                                 f' - {item.get("product_id")}')
                    raise ProductDoesNotExistsException("Product Does Not Exist")

                tier_obj = Tier.objects.filter(id=tier.get("tier_id"), is_deleted=False)
                if not tier_obj:
                    logger.error(f'tier does not exist for given id'
                                 f' - {tier.get("tier_id")}')
                    raise TierDoesNotExistsException("Tier Does Not Exist")

                QuoteDetails.objects.create(
                    quote_id=quote_obj,
                    product_id=product_obj[0],
                    tier_id=tier_obj[0],
                    tenant_id=tenant_obj,
                    details=json.dumps(details),
                )
        # check for user impersonation
        if request.auth and request.auth[0]:
            tenant_obj = Tenant.objects.get(id=tenant_id, is_deleted=False)
            QuoteHistory.objects.create(
                admin_user_id=request.auth[1],
                user_id=get_user_obj_from_email(request.user[0]),
                description='Quote Created',
                tenant_id=tenant_obj,
                quote_id=quote_obj,
                details=json.dumps({})
            )
        return ResponseBuilder.success(
            data={"message": "Quote created successfully", "id": quote_obj.id},
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def generate_quote_number(tenant_id):
        # Query the database to find the highest quote number with the format 'Q_000001'
        latest_quote = (
            Quote.objects.filter(
                tenant_id=tenant_id, quote_number__regex=r"^Q_\d{6}$"
            ).order_by("-quote_number").first()
        )

        if latest_quote:
            # Extract the numeric part of the quote number and increment it
            number_part = int(
                latest_quote.quote_number[2:]
            )  # Remove 'Q_' and convert to int
            next_number_part = number_part + 1

            # Format the next quote number as 'Q_000001'
            next_quote_number = f"Q_{str(next_number_part).zfill(6)}"
        else:
            # If no contracts exist for the tenant, start with 'C_000001'
            next_quote_number = "Q_000001"

        return next_quote_number


class PricingCalculatorDetailView(APIView):
    serializer_class = PricingCalcSerializer
    authentication_classes = [CognitoAuthentication]

    @staticmethod
    def get(request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        response = {
            "id": id,
            "name": quote_obj.name,
            "owner_id": quote_obj.user_id.id,
            "owner_name": quote_obj.user_id.name,
            "assigned_to_id": quote_obj.assigned_to.id
            if quote_obj.assigned_to
            else None,
            "assigned_to_name": quote_obj.assigned_to.name
            if quote_obj.assigned_to
            else None,
            "account_id": quote_obj.account_id.id if quote_obj.account_id else None,
            "account_name": quote_obj.account_id.name if quote_obj.account_id else None,
            "total_price": quote_obj.total_price,
            "discount": quote_obj.discount,
            "quote_number": quote_obj.quote_number,
            "quote_url": quote_obj.quote_url,
            "opportunity_id": quote_obj.opportunity_id.id
            if quote_obj.opportunity_id
            else None,
            "opportunity_name": quote_obj.opportunity_id.name
            if quote_obj.opportunity_id
            else None,
            "price_book_id": quote_obj.price_book_id.id,
            "price_book_name": quote_obj.price_book_id.name,
            "status": quote_obj.status,
            "columns": [
                {"name": "Quantity", "key": "qty"},
                {"name": "List Unit Price", "key": "list_unit_price"},
                {"name": "Discounted Unit Price", "key": "discounted_unit_price"},
                {"name": "List Total Price", "key": "list_total_price"},
                {"name": "Discounting %", "key": "discounting"},
                {"name": "Discounted Total Price", "key": "discounted_total_price"},
            ],
            "deal_term_details": json.loads(quote_obj.deal_term_details)
            if quote_obj.deal_term_details else {}
        }

        quote_details = QuoteDetails.objects.filter(
            quote_id=quote_obj, tenant_id=tenant_id, is_deleted=False
        )

        temp_quote_data = {}
        quote_info = []
        for item in quote_details:
            quote_data = {}
            data = {"tier_id": item.tier_id.id, "tier_name": item.tier_id.name}
            details = json.loads(item.details)
            if details.get("columns"):
                response.update({"columns": details.pop("columns")})
            if details.get("total"):
                data.update({"total": details.pop("total")})
            addons = details.get("addons")
            if addons:
                for row in addons.get("rows", []):
                    addon_name = Feature.objects.get(
                        id=row.get("addon_id"), is_deleted=False
                    )
                    row["name"] = addon_name.name
            data.update({"details": details})

            product_id = item.product_id.id
            if product_id in temp_quote_data:
                tiers_data = temp_quote_data[product_id]
                quote_data.update({"tiers": tiers_data.append(data)})
            else:
                quote_data["product_id"] = product_id
                quote_data["product_name"] = item.product_id.name
                quote_data["tiers"] = [data]
                temp_quote_data[product_id] = [data]
                quote_info.append(quote_data)
        response["quote_details"] = quote_info
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)

    @staticmethod
    def delete(request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False).first()
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        if quote_obj.contract_id and not quote_obj.contract_id.is_deleted:
            logger.error(f'unable to delete quote as it '
                         f'is associated with a contract for given id - {id}')
            raise QuoteAssociatedWithContractException(
                "Unable to delete quote as it is associated with a contract")

        quote_obj.is_deleted = True
        quote_obj.save()
        return ResponseBuilder.success(
            data="Quote deleted successfully", status_code=status.HTTP_200_OK
        )


class QuoteCommentView(APIView):
    serializer_class = QuoteCommentSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=CreateQuoteCommentSerializer)
    def post(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        data = request.data
        quote_obj = Quote.objects.filter(id=id, tenant_id=tenant_id, is_deleted=False)
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")

        user_obj = User.objects.get(email=request.user[0], is_deleted=False)
        QuoteNote.objects.create(
            quote_id=quote_obj[0], user_id=user_obj, comment=data.get("comment")
        )
        return ResponseBuilder.success(
            data="Comment added successfully", status_code=status.HTTP_200_OK
        )

    @staticmethod
    def get(request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        quote_obj = Quote.objects.get(id=id, tenant_id=tenant_id, is_deleted=False)
        if not quote_obj:
            logger.error(f'quote does not exist for given id - {id}')
            raise QuoteDoesNotExistsException("Quote Does Not Exist")
        quote_note_obj = QuoteNote.objects.filter(
            quote_id=id, is_deleted=False).order_by("created_on")
        response = [
            {
                "id": item.id,
                "comment": item.comment,
                "user_id": item.user_id.id,
                "user_name": item.user_id.username,
                "created_on": item.created_on,
                "name": item.user_id.name,
            }
            for item in quote_note_obj
        ]
        return ResponseBuilder.success(data=response, status_code=status.HTTP_200_OK)
