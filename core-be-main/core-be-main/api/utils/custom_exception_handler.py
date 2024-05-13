from django.http import JsonResponse
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class BaseCustomException(APIException):
    detail = None
    status_code = None

    def __init__(self, detail, code):
        super().__init__(detail, code)
        self.detail = detail
        self.status_code = code


class UserDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PackageDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PackageDoesNotHaveTiersException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PlanDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PriceBookDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class PriceBookRuleDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class PriceBookRuleExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class PricingModelDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PricingModelDetailsDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class InvalidQuoteStatusException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class QuoteDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class QuoteAssociatedWithContractException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class TierDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class TenantDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class OpportunityDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class OpportunityStageDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class OpportunityStageNameAlreadyExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class OpportunityTypeNameAlreadyExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class OpportunityTypeDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class FeatureNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class RepositoryNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class FeatureGroupNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class AccountDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class IndustryTypeDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class PriceBookDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ProductDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ProductAssociatedWithRepository(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class FeatureAssociatedWithRepository(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class FeatureGroupAssociatedWithRepository(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class PlanAssociatedWithRepository(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ProductAssociatedWithQuote(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class MetricLimitException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ProductAlreadyExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class FeatureDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class UserRoleDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class RootAdminDoesNotExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class FileNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class UserCreationFailedException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class FeatureAlreadyAssignedException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ManagerNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ManagerDoesNotHaveQuoteApprovalPermissionException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ContractNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class AccountSignerMismatchException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class CustomerSignerMismatchException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class RoleNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ContractSignatureNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class ContractTemplateNotFoundException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class TierAlreadyExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class CustomAddonExistsException(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


class SalesforceConfigError(BaseCustomException):
    def __init__(self, detail):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data["message"] = response.data["detail"]
        del response.data["detail"]

    return JsonResponse(
        data={"message": response.data["message"]},
        status=response.status_code,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, impersonation-user-email",
            "Access-Control-Allow-Methods": "*",
        },
        safe=False,
    )
