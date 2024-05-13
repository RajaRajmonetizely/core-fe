import base64
import json
import logging
import os
import boto3
import requests
from botocore.exceptions import ClientError


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

client = boto3.client("cognito-idp")

def get_secret_value(secret_id, region="us-east-1"):
    session = boto3.session.Session()
    secret_client = session.client(service_name="secretsmanager", region_name=region)
    try:
        get_secret_value_response = secret_client.get_secret_value(SecretId=secret_id)
    except ClientError as err:
        raise err
    else:
        if "SecretString" in get_secret_value_response:
            secret = get_secret_value_response["SecretString"]
        else:
            secret = base64.b64decode(get_secret_value_response["SecretBinary"])

    return json.loads(secret)


def lambda_handler(event, context):
    logger.info("Handler invoked")
    url = os.getenv("SALESFORCE_SYNC_URL")
    logger.info("Cron URL %s", url)
    cognito_details = get_secret_value(secret_id=os.getenv("COGNITO_SECRET"))

    resp = client.admin_initiate_auth(
        UserPoolId=cognito_details["user_pool_id"],
        ClientId=cognito_details["client_id"],
        AuthFlow="ADMIN_NO_SRP_AUTH",
        AuthParameters={
            "USERNAME": cognito_details["username"],
            "PASSWORD": cognito_details["password"],
        },
    )
    payload = {"job_type": "cron_job"}
    headers = {
        "Authorization": "Bearer " + resp["AuthenticationResult"]["AccessToken"],
        "InvocationType": "Event"
    }
    print("Cron jon in Action:::")
    response = requests.post(url, headers=headers, data={}, params=payload)
    print(response.text)
    return {"statusCode": 200, "body": json.dumps("Hello from Lambda!")}
