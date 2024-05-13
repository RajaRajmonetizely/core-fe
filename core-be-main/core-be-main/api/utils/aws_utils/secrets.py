

import base64
import json

import boto3
from botocore.exceptions import ClientError


class AwsSecret:

    @staticmethod
    def get(secret_id, region="us-east-1"):
        """Get secret value by name"""
        session = boto3.session.Session()
        client = session.client(service_name="secretsmanager", region_name=region)
        try:
            get_secret_value_response = client.get_secret_value(SecretId=secret_id)
        except ClientError as err:
            raise err
        else:
            if "SecretString" in get_secret_value_response:
                secret = get_secret_value_response["SecretString"]
            else:
                secret = base64.b64decode(get_secret_value_response["SecretBinary"])

        return json.loads(secret)

    @staticmethod
    def update(secret_id, config, region="us-east-1"):
        """Get secret value by name"""
        session = boto3.session.Session()
        client = session.client(service_name="secretsmanager", region_name=region)
        try:
            client.update_secret(SecretId=secret_id, SecretString=config)
        except ClientError as err:
            raise err
