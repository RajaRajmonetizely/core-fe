import csv
import io
import json
import os
import time
import uuid

import requests
from django.apps import apps
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.account.models import Account, Opportunity
from api.auth.authentication import CognitoAuthentication
from api.user.utils import get_tenant_id_from_email
from api.utils.aws_utils.secrets import AwsSecret
from api.salesforce.serializers.account import AccountSFSerializer
from api.user.models import OrgHierarchy
from api.utils.responses import ResponseBuilder
from api.utils.salesforce.salesforce_util import SForceUtil


class SFAccountView(GenericAPIView):
    """Salesforce Account CRUD"""

    serializer_class = AccountSFSerializer
    base_url = os.getenv("SALESFORCE_CONFIG_SECRET_ID")

    def get(self, request):
        sf_credentials = SForceUtil.get_salesforce_login()
        headers = {
            "Authorization": "Bearer " + sf_credentials["access_token"],
            "Content-Type": "application/json",
        }
        payload = {
            "operation": "query",
            "query": "SELECT Id, Name FROM Account limit 5",
        }
        account_url = SFAccountView.base_url + "v47.0/jobs/query"
        response = requests.post(account_url, headers=headers, json=payload)

        # Extract the data from the response
        data = response.json()

        job_id = data["id"]

        if response.status_code == 200:
            print(f"Query job created with ID: {job_id}")
            account_url = account_url + f"/{job_id}/" + "results"
            accounts = requests.get(account_url, headers=headers)
            reader = csv.DictReader(io.StringIO(accounts.text))
            json_data = json.loads(json.dumps(list(reader)))
            return ResponseBuilder.success(message="success", data=json_data)
        else:
            print("Error occurred:", response.text)
            return ResponseBuilder.errors(message="Error")

    @swagger_auto_schema(request_body=AccountSFSerializer)
    def post(self, request):
        request = request.data
        sf_credentials = SForceUtil.get_salesforce_login()
        headers = {
            "Authorization": "Bearer " + sf_credentials["access_token"],
            "Content-Type": "application/json",
        }
        payload = {"Name": request["name"]}
        account_url = SFAccountView.base_url + "v57.0/sobjects/Account"
        response = requests.post(account_url, headers=headers, json=payload)
        return ResponseBuilder.success(message="success", data=response.json())


class SFOpportunityView(GenericAPIView):
    """Salesforce Account CRUD"""

    # base_url = SForceUtil.get_base_url()

    def get(self, request):
        sf_credentials = SForceUtil.get_salesforce_login()
        headers = {
            "Authorization": "Bearer " + sf_credentials["access_token"],
            "Content-Type": "application/json",
        }
        payload = {
            "operation": "query",
            "query": "SELECT Id, Name, AccountId, Amount, Type FROM opportunity limit 5",
        }
        opportunity_url = SFAccountView.base_url + "v47.0/jobs/query"
        response = requests.post(opportunity_url, headers=headers, json=payload)

        # Extract the data from the response
        data = response.json()
        job_id = data["id"]
        if response.status_code == 200:
            print(f"Query job created with ID: {job_id}")
            opportunity_url = opportunity_url + f"/{job_id}/" + "results"
            opportunity = requests.get(opportunity_url, headers=headers)
            reader = csv.DictReader(io.StringIO(opportunity.text))
            json_data = json.loads(json.dumps(list(reader)))
            return ResponseBuilder.success(message="success", data=json_data)
        else:
            print("Error occurred:", response.text)
            return ResponseBuilder.errors(message="Error")

    def post(self, request):
        request = request.data


class SFUserRoleView(GenericAPIView):
    authentication_classes = [CognitoAuthentication]

    base_url = os.getenv("SF_URL")
    secret_id = os.getenv("SALESFORCE_CONFIG_SECRET_ID")

    def _get_salesforce_login(self, config):
        """Get Salesforce access token"""
        url = (
            f"https://login.salesforce.com/services/oauth2/token?"
            f"grant_type=password&client_id={config.get('client_id')}"
            f"&client_secret={config.get('client_secret')}&username={config.get('username')}&password={config.get('password')}"
        )
        headers = {
            "Cookie": "BrowserId=AgAOoPO9Ee2mTXUMp9i4QQ; CookieConsentPolicy=0:0; "
            "LSKey-c$CookieConsentPolicy=0:0"
        }
        response = requests.request(
            "POST", url, headers=headers, data={}, files={}, timeout=10
        )
        if response.status_code:
            return response.json()["access_token"]
        raise Exception("Error while getting tokens")

    def _get_headers(self, config):
        """Get Headers"""
        access_token = self._get_salesforce_login(config)
        return {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json",
        }

    def _create_job(self, config, operation, payload):
        """Create job for bulk API"""
        url = f"{config.get('url')}/jobs/{operation}/"
        headers = self._get_headers(config)
        with requests.post(url, headers=headers, json=payload, timeout=10) as response:
            response.raise_for_status()
            return response.json()

    def _get_job_status(self, config, job_id):
        """Get job status"""
        url = f"{config.get('url')}/jobs/query/{job_id}"
        headers = self._get_headers(config)
        with requests.get(url, headers=headers, timeout=10) as response:
            response.raise_for_status()
            return response.json()

    def _get_results(self, config, job_id):
        """Get salesforce query Results"""
        url = f"{config.get('url')}/jobs/query/{job_id}/results"
        headers = self._get_headers(config)
        with requests.get(url, headers=headers, timeout=10) as response:
            response.raise_for_status()
            return response.text

    def _wait_for_batch(self, config, job_id, max_timeout=120):
        """Wait for batch for status JobComplete"""
        job_status = ""
        timeout = 1
        while job_status != "JobComplete":
            job_status = self._get_job_status(config, job_id=job_id)["state"]
            if timeout <= max_timeout:
                time.sleep(timeout)
                timeout *= 2
            else:
                raise Exception("Job Incomplete")

    def get(self, request):
        tenant_id = get_tenant_id_from_email(request.user[0])
        config = AwsSecret.get(secret_id=SFUserRoleView.secret_id).get(
            str(tenant_id), {}
        )
        if not config:
            return ResponseBuilder.success(message="success", data=[])
        headers = {
            "Authorization": "Bearer " + self._get_salesforce_login(config),
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "operation": "query",
            "query": "SELECT ID, Name FROM Profile",
        }
        user_role_url = config.get("url") + "/jobs/query"
        response = requests.post(user_role_url, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()
            job_id = data["id"]
            self._wait_for_batch(config, job_id=job_id)

            user_role_url = user_role_url + f"/{job_id}" + "/results"
            user_role_response = requests.get(user_role_url, headers=headers)

            # Parse the CSV data to a list of dictionaries
            csv_data = user_role_response.text
            csv_list = list(csv.DictReader(csv_data.splitlines()))
            response_data = [
                {"id": item["Id"], "name": item["Name"]} for item in csv_list
            ]

            return ResponseBuilder.success(message="success", data=response_data)
        else:
            print("Error occurred:", response.text)
            return ResponseBuilder.errors(message="Error")
