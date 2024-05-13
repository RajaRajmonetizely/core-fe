"""
This utility would be used to connect with AWS Cognito and their features
"""
import os

import boto3

from api.utils.aws_utils.secrets import AwsSecret


class AwsCognito:

    user_pool_id = os.getenv("USER_POOL_ID")
    aws_region = os.getenv("REGION")
    aws_access_secret = os.getenv("AWS_ACCESS_SECRET")

    aws_config = AwsSecret.get(secret_id=aws_access_secret)
    aws_access_key = aws_config["AWS_KEY_ID"]
    aws_secret_key = aws_config["AWS_SECRET_ACCESS_KEY"]

    client = boto3.client(
        "cognito-idp",
        region_name=aws_region,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
    )
    cognito_base_url = f"https://cognito-idp.{aws_region}.amazonaws.com/{user_pool_id}"
    jwks_url = f"{cognito_base_url}/.well-known/jwks.json"

    @staticmethod
    def get_user(access_token=None):
        """
        This method would return the user detail based on the given access_token
        """
        try:
            return AwsCognito.client.get_user(AccessToken=access_token)
        except AwsCognito.client.exceptions.NotAuthorizedException as e:
            raise Exception(str(e))
