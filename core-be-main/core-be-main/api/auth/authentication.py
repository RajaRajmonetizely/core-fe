import json
import os
import re

import jwt
import requests
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

from api.auth.cognito import AwsCognito
from api.user.models import UserRole, UserRoleMapping, User
from api.user.utils import get_user_obj_from_email
from api.utils.logger import logger


class CognitoAuthentication(authentication.BaseAuthentication):
    user_pool_id = os.getenv("USER_POOL_ID")
    aws_region = os.getenv("REGION")
    cognito_base_url = f"https://cognito-idp.{aws_region}.amazonaws.com/{user_pool_id}"
    jwks_url = f"{cognito_base_url}/.well-known/jwks.json"

    @staticmethod
    def get_auth_token(request):
        try:
            authorization_token = request.META["HTTP_AUTHORIZATION"]
            return re.sub(r"^Bearer\s+", "", authorization_token)
        except Exception:
            raise AuthenticationFailed("No Authorization Details")

    @staticmethod
    def get_public_keys():
        jwks = requests.get(CognitoAuthentication.jwks_url, timeout=30).json()
        public_keys = {}
        for jwk in jwks.get("keys"):
            kid = jwk.get("kid")
            public_keys[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
        return public_keys

    def authenticate(self, request):
        exclusion_list = ["/", "/login"]
        if request.path in exclusion_list:
            return "success", None
        access_token = self.get_auth_token(request)
        if not access_token:
            return None
        try:
            unverified_header = jwt.get_unverified_header(access_token)
            token_kid = unverified_header.get("kid")
            public_keys = CognitoAuthentication.get_public_keys()
            key = public_keys.get(token_kid)

            token_decoded = jwt.decode(
                jwt=access_token,
                key=key,
                algorithms=["RS256"],
                issuer=CognitoAuthentication.cognito_base_url,
                options={"verify_signature": True},
            )

            user_attr = self.get_user_email_from_cognito_id_or_access_token(
                token_decoded.get("sub"), access_token
            )
            user_attr, is_impersonate, root_admin_user = self.check_allow_for_user(
                request, user_attr
            )
            logger.info(
                "\nUser detail - %s, Is_impersonate - %s, Root Admin User - %s",
                user_attr,
                is_impersonate,
                root_admin_user,
            )
            logger.info(
                "\nMethod - %s, Path - %s, Query Params - %s, Body - %s",
                request.method,
                request.get_full_path(),
                request.query_params,
                request.data,
            )
            return user_attr, (is_impersonate, root_admin_user)
        except Exception:
            raise AuthenticationFailed("Invalid Token")

    @staticmethod
    def check_allow_for_user(request, user_attr):
        """
        :param request:
        :param user_attr:
        :return: impersonate_user_email,  is_impersonate(True/False), logged_root_user_email
        """
        is_impersonate = False
        root_admin_user = None
        impersonation_user_email = request.headers.get("impersonation-user-email")
        if impersonation_user_email and user_attr:
            root_admin_role_obj = UserRole.objects.filter(
                name="Root admin", is_deleted=False
            )
            if root_admin_role_obj:
                user_obj = get_user_obj_from_email(user_attr[0])
                user_role_map_obj = UserRoleMapping.objects.filter(
                    user_id=user_obj.id,
                    user_role_id=root_admin_role_obj[0].id,
                    is_deleted=False,
                ).first()
                if user_role_map_obj:
                    is_impersonate = True
                    root_admin_user = user_obj
                    user_attr = [impersonation_user_email]
        return user_attr, is_impersonate, root_admin_user

    def get_user_email_from_cognito_id_or_access_token(self, cognito_id, access_token):
        if cognito_id:
            user_obj = User.objects.filter(
                cognito_user_id=cognito_id, is_deleted=False
            ).first()
            if not user_obj:
                return self.get_aws_cognito_user(cognito_id, access_token)
            return [user_obj.email]
        else:
            return self.get_aws_cognito_user(cognito_id, access_token)

    @staticmethod
    def get_aws_cognito_user(cognito_id, access_token):
        user_detail = AwsCognito.get_user(access_token=access_token)
        email = [
            item.get("Value")
            for item in user_detail.get("UserAttributes")
            if item.get("Name") == "email"
        ]
        # user_obj = get_user_obj_from_email(email[0])
        # user_obj.cognito_user_id = cognito_id
        # user_obj.save()
        return email
