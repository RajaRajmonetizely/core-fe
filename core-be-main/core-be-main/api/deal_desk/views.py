from datetime import datetime

from django.db.models import Count
from django.db.models import Prefetch
from django.db.models import Q
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from api.account.models import Opportunity, Contract
from api.auth.authentication import CognitoAuthentication
from api.contract.models import ContractSignature, ContractSignerDetails
from api.pricing_calculator.models import Quote
from api.user.models import User
from api.user.utils import get_tenant_id_from_email
from api.utils.responses import ResponseBuilder


class DealDeskViewSet(ModelViewSet):
    authentication_classes = [CognitoAuthentication]
    queryset = Opportunity.objects.all()
    http_method_names = ["get"]

    def filter_queryset(self, tenant_id):
        queryset = Opportunity.objects.filter(tenant_id=tenant_id)

        close_start_date = self.request.query_params.get("close_start_date", None)
        close_end_date = self.request.query_params.get("close_end_date", None)
        opportunity_owner = self.request.query_params.get("opportunity_owner", None)
        pricebook = self.request.query_params.get("pricebook", None)
        assigned_to = self.request.query_params.get("assigned_to", None)
        opportunity_id = self.request.query_params.get("opportunity_id", None)

        # Create an empty Q object to build the filter dynamically
        combined_filter = Q()

        if close_start_date:
            close_start_date = timezone.make_aware(
                datetime.strptime(close_start_date, "%Y-%m-%d")
            ).date()
            combined_filter &= Q(close_date__date__gte=close_start_date)

        if close_end_date:
            close_end_date = timezone.make_aware(
                datetime.strptime(close_end_date, "%Y-%m-%d")
            ).date()
            combined_filter &= Q(close_date__date__lte=close_end_date)

        if opportunity_owner:
            combined_filter |= Q(owner_id=opportunity_owner)

        if opportunity_id:
            combined_filter |= Q(id=opportunity_id)

        if pricebook:
            combined_filter |= Q(quote__price_book_id=pricebook)

        if assigned_to:
            # Fetch the list of user_ids for the given org_hierarchy_id and tenant_id
            assigned_to_user_ids = User.objects.filter(
                org_hierarchy_id=assigned_to, tenant_id=tenant_id, is_deleted=False
            ).values_list("id", flat=True)

            # Use the list of user_ids to filter the assigned_to field
            combined_filter |= Q(quote__assigned_to__in=list(assigned_to_user_ids))

        queryset = queryset.filter(combined_filter)

        # Prefetch related quotes and contracts for the opportunities
        queryset = queryset.prefetch_related(
            Prefetch(
                "quote_set",
                queryset=Quote.objects.select_related("contract_id").annotate(
                    num_comments=Count(
                        "quotenote"
                    )  # Annotate each quote with the number of comments
                ),
            )
        )

        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "close_start_date",
                openapi.IN_QUERY,
                description="Filter by Opportunity Close Start Date",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "close_end_date",
                openapi.IN_QUERY,
                description="Filter by Opportunity Close End Date",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "opportunity_owner",
                openapi.IN_QUERY,
                description="Filter by Opportunity Owner ID",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "pricebook",
                openapi.IN_QUERY,
                description="Filter by Pricebook ID in Quote",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "assigned_to",
                openapi.IN_QUERY,
                description="Org hierarchy ID to which it is assigned to",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "opportunity_id",
                openapi.IN_QUERY,
                description="filter based on the given opportunity ID",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: openapi.Response("Success")},
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(
            tenant_id=get_tenant_id_from_email(request.user[0])
        )

        # Use a dictionary to store opportunities and their related quotes
        opportunity_dict = {}

        for opportunity in queryset:
            opportunity_data = {
                "id": opportunity.id,
                "name": opportunity.name,
                "owner_name": opportunity.owner_id.name
                if opportunity.owner_id
                else None,
                "owner_id": opportunity.owner_id.id if opportunity.owner_id else None,
                "amount": opportunity.amount,
                "probability": opportunity.probability,
                "close_date": opportunity.close_date,
                "description": opportunity.description,
                "quotes": [
                    {
                        "quote_id": quote.id,
                        "quote_name": quote.name,
                        "quote_status": quote.status,
                        "num_comments": quote.num_comments,
                        "created_on": quote.created_on,
                        "updated_on": quote.updated_on,
                        "contract_details": self.get_contract_and_template_info(
                            quote.contract_id.id
                        )
                        if quote.contract_id
                        else {},
                    }
                    for quote in opportunity.quote_set.all().order_by('-updated_on')
                ],
            }

            opportunity_dict[opportunity.id] = opportunity_data

        final_response_data = list(opportunity_dict.values())

        # Sort opportunities
        final_response_data.sort(key=self.get_most_recent_update, reverse=True)

        # Sort quotes for each opportunity
        for opportunity in final_response_data:
            opportunity["quotes"].sort(key=self.sort_quotes_by_update, reverse=True)

        return ResponseBuilder.success(
            data=final_response_data, status_code=status.HTTP_200_OK
        )

    def get_most_recent_update(self, opportunity):
        """
        For a given opportunity, get the most recent update time either from
        the associated contracts or from the quotes (if no contract is linked).
        """
        most_recent_update = timezone.make_aware(datetime.min)
        for quote in opportunity["quotes"]:
            contract_update = quote["contract_details"].get("updated_on", timezone.make_aware(datetime.min))
            quote_update = quote.get("updated_on", timezone.make_aware(datetime.min))
            most_recent_update = max(most_recent_update, contract_update, quote_update)
        return most_recent_update

    def sort_quotes_by_update(self, quote):
        """
        Get the update time of a quote's linked contract. If there's no linked contract,
        use the quote's update time.
        """
        return quote["contract_details"].get("updated_on", quote["updated_on"])

    @staticmethod
    def get_contract_signing_status(contract_id):
        contract_signature_obj = ContractSignature.objects.filter(
            contract_id=contract_id, is_deleted=False
        ).first()
        if not contract_signature_obj:
            return None
        if contract_signature_obj.status == "Activated":
            return "COMPLETED"
        return "PENDING"

    @staticmethod
    def get_contract_and_template_info(contract_id):
        contract = Contract.objects.filter(id=contract_id, is_deleted=False).first()
        contract_signature = ContractSignature.objects.filter(
            contract_id=contract_id, is_deleted=False
        ).first()
        signer_details = None
        if contract_signature:
            signers = ContractSignerDetails.objects.filter(
                contract_signature_id=contract_signature.id, is_deleted=False
            )
            signer_details = [
                {
                    "signer_name": item.signer_name,
                    "signer_email_address": item.signer_email_address,
                    "id": item.id,
                    "order": item.order,
                    "signer_type": item.signer_type,
                }
                for item in signers
            ]
        contract_details = {
            "contract_name": contract.name,
            "contract_status": contract.status,
            "template_id": contract.template_id.id if contract.template_id else None,
            "template_name": contract.template_id.name
            if contract.template_id
            else None,
            "s3_file_path": contract.s3_file_path,
            "company_signed_email": contract.company_signed_email,
            "customer_signed_email": contract.customer_signed_email,
            "signer_count": contract.signer_count,
            "company_signed_date": contract.company_signed_date,
            "customer_signed_date": contract.customer_signed_date,
            "contract_number": contract.contract_number,
            "contract_id": contract.id,
            "contract_start_date": contract.start_date,
            "contract_end_date": contract.end_date,
            "signer_details": signer_details if signer_details else [],
            "maintain_order_at": contract_signature.maintain_order_at if contract_signature else None,
            "contract_expiry": contract_signature.expires_at
            if contract_signature
            else None,
            "created_on": contract.created_on,
            "updated_on": contract.updated_on
        }
        return contract_details
