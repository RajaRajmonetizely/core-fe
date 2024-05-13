from api.tenant.models import Tenant
from api.user.models import User
from api.utils.custom_exception_handler import (
    TenantDoesNotExistsException,
    UserDoesNotExistsException,
)
from api.utils.logger import logger
from math import ceil


class TrieNode:
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.children = []


def get_tenant_id_from_email(email):
    user_obj = User.objects.filter(email=email, is_deleted=False)
    if not user_obj:
        logger.error(f"user not found for - {email}")
        raise UserDoesNotExistsException("User does not exists")
    tenant_obj = Tenant.objects.filter(id=user_obj[0].tenant_id.id, is_deleted=False)
    if not tenant_obj:
        logger.error(f"tenant not found for - {email}")
        raise TenantDoesNotExistsException("Tenant does not exists")
    return tenant_obj[0].id


def get_user_obj_from_email(email):
    user_obj = User.objects.filter(email=email, is_deleted=False)
    if not user_obj:
        logger.error(f"user not found for - {email}")
        raise UserDoesNotExistsException("User does not exists")
    return user_obj[0]


def generate_unique_common_difference_numbers(start, end):
    if end - start >= 100:
        numbers = 100
    elif end == start:
        start = 0
        numbers = 100 if end >= 100 else end
    else:
        numbers = end - start

    # Calculate the common difference based on the range and the number of elements
    common_difference = ceil(end / numbers)

    # Generate the list of numbers with the common difference
    unique_numbers = [
        start + i * common_difference
        for i in range(numbers)
        if start + i * common_difference <= end
    ]

    # Make sure the last number matches the upper bound of the range
    if unique_numbers[-1] < end:
        unique_numbers.append(end)
    return unique_numbers
