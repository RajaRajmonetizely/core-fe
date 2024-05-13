import boto3
import os
from api.utils.aws_utils.secrets import AwsSecret


class MonetizelyAwsUtils:

    aws_access_secret = os.getenv("AWS_ACCESS_SECRET")
    region = os.getenv("REGION")
    user_pool_id = os.getenv("USER_POOL_ID")

    aws_config = AwsSecret.get(secret_id=aws_access_secret)
    aws_access_key = aws_config["AWS_KEY_ID"]
    aws_secret_key = aws_config["AWS_SECRET_ACCESS_KEY"]

    client = boto3.client(
        "cognito-idp",
        region_name=region,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
    )
