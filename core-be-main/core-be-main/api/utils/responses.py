from http import HTTPStatus
from typing import Any

from django.http import JsonResponse


class ResponseBuilder:
    status_codes = HTTPStatus

    @staticmethod
    def success(message: str = "success", data: Any = None, status_code: int = 200, groups=None,
                user_id=None):
        data = {"message": message, "data": data}
        if groups:
            data['groups'] = groups
        if user_id:
            data['user_id'] = user_id
        return JsonResponse(
            status=status_code,
            data=data,
            headers={"Access-Control-Allow-Origin": "*",
                     "Access-Control-Allow-Headers": "Content-Type, impersonation-user-email",
                     "Access-Control-Allow-Methods": "*"},
            safe=False,
        )

    @staticmethod
    def errors(
            message: str = "error",
            data: Any = None,
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
    ):
        return JsonResponse(
            data={"message": message, "errors": data} if data else {"message": message},
            status=status_code,
            headers={"Access-Control-Allow-Origin": "*",
                     "Access-Control-Allow-Headers": "Content-Type, impersonation-user-email",
                     "Access-Control-Allow-Methods": "*"},
            safe=False,
        )
