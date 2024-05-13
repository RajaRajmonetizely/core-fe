import csv
import io
import json
import os
import time
from datetime import datetime
from io import StringIO

import requests
from django.db import transaction
from django.utils.timezone import make_aware, now
from rest_framework import status
from rest_framework.generics import GenericAPIView

from api.account.models import (
    Account,
    Contract,
    IndustryType,
    Opportunity,
    OpportunityStage,
    OpportunityType,
)
from api.auth.authentication import CognitoAuthentication
from api.pricing_calculator.models import Quote
from api.pricing_calculator.serializers.quote import QuoteSerializer
from api.contract.serializers.contract import ContractSerializer
from api.salesforce.models import SalesforceMappingModel
from api.tenant.models import Tenant
from api.user.models import OrgHierarchy, User, UserRole, UserRoleMapping
from api.user.utils import get_tenant_id_from_email
from api.utils.aws_utils.dynamo_db import AwsDynamodb
from api.utils.aws_utils.secrets import AwsSecret
from api.utils.responses import ResponseBuilder
from api.utils.logger import logger
from api.contract.views.contract import ContractViewSet


class Salesforce:
    """Class Salesforce"""

    def __init__(self, config):
        self.base_url = config.get("url")
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.username = config.get("username")
        self.password = config.get("password")
        self.access_token = self._get_salesforce_login()

    def _get_salesforce_login(self):
        """Get salesforce access token"""
        logger.info("Generating Access token for accessing salesforce API")
        url = (
            f"https://login.salesforce.com/services/oauth2/token?"
            f"grant_type=password&client_id={self.client_id}"
            f"&client_secret={self.client_secret}&username={self.username}&password={self.password}"
        )
        headers = {
            "Cookie": "BrowserId=AgAOoPO9Ee2mTXUMp9i4QQ; CookieConsentPolicy=0:0; "
            "LSKey-c$CookieConsentPolicy=0:0"
        }
        response = requests.request(
            "POST", url, headers=headers, data={}, files={}, timeout=10
        )
        if response.status_code:
            logger.info("!!! Access token generated successfully !!!")
            return response.json()["access_token"]
        raise Exception("Error while getting tokens")

    def _get_headers(self):
        """Get Headers"""
        return {
            "Authorization": "Bearer " + self.access_token,
            "Content-Type": "application/json",
        }

    def create_job(self, operation, payload):
        """Create job for bulk API"""
        url = f"{self.base_url}/jobs/{operation}/"
        logger.info("Creating a job for bulk API %s", url)
        response = requests.post(
            url, headers=self._get_headers(), json=payload, timeout=10
        )
        return response.json()

    def update_results(self, job_id, payload):
        """Update values in Salesforce"""
        url = f"{self.base_url}/jobs/ingest/{job_id}/batches/"
        logger.info("Insert/Update data back to salesforce for %s", url)
        headers = {
            "Authorization": "Bearer " + self.access_token,
            "Content-Type": "text/csv",
        }
        response = requests.put(url, headers=headers, data=payload, timeout=10)
        return response.text

    def get_job_status(self, job_id):
        """Get job status"""
        url = f"{self.base_url}/jobs/query/{job_id}"
        logger.info("Get the job status %s", url)
        response = requests.get(url, headers=self._get_headers(), timeout=10)
        return response.json()

    def get_ingest_job_status(self, job_id):
        """Get job status"""
        url = f"{self.base_url}/jobs/ingest/{job_id}"
        response = requests.get(url, headers=self._get_headers(), timeout=10)
        return response.json()

    def get_results(self, job_id):
        """Get salesforce query Results"""
        url = f"{self.base_url}/jobs/query/{job_id}/results"
        response = requests.get(url, headers=self._get_headers(), timeout=10)
        return response.text

    def delete_job(self, job_id, operation):
        """Delete job"""
        url = f"{self.base_url}/jobs/{operation}/{job_id}"
        logger.info("Deleting the job %s", url)
        response = requests.delete(url, headers=self._get_headers(), timeout=10)
        return response.text

    def close_job(self, job_id, operation):
        """Close a job"""
        url = f"{self.base_url}/jobs/{operation}/{job_id}"
        logger.info("Closing the Job %s", url)
        payload = json.dumps({"state": "UploadComplete"})
        response = requests.patch(
            url, headers=self._get_headers(), data=payload, timeout=10
        )
        return response.text

    def bulk_job_results(self, job_id):
        url = f"{self.base_url}/jobs/ingest/{job_id}/successfulResults/"
        response = requests.get(url, headers=self._get_headers(), timeout=10)
        return response.text

    def wait_for_batch(self, job_id, job_type=None):
        """Wait for batch for status JobComplete"""
        job_status = ""
        counter = 1
        while job_status != "JobComplete":
            if job_type == "ingest":
                job_status = self.get_ingest_job_status(job_id=job_id)["state"]
            else:
                job_status = self.get_job_status(job_id=job_id)["state"]
            if counter <= 10:
                logger.info("!!! Waiting for job to be completed %s!!!", job_id)
                time.sleep(counter)
                counter += 1
            else:
                logger.error("Job Incomplete after long time wait")
                break

    def bulk_upsert_data(self, s_object, external_id_field_name, csv_data):
        """Bulk upsert values in salesforce"""
        logger.info("Bulk update data for %s", s_object)
        job_payload = {
            "object": f"{s_object}",
            "externalIdFieldName": f"{external_id_field_name}",
            "contentType": "CSV",
            "operation": "upsert",
            "lineEnding": "CRLF",
        }
        response = self.create_job(operation="ingest", payload=job_payload)
        self.update_results(job_id=response["id"], payload=csv_data)
        self.close_job(job_id=response["id"], operation="ingest")

    def bulk_insert(self, s_object, csv_data):
        """Bulk insert values in salesforce"""
        logger.info("Bulk insert data for %s", s_object)
        job_payload = {
            "object": f"{s_object}",
            "contentType": "CSV",
            "operation": "insert",
            "lineEnding": "CRLF",
        }
        response = self.create_job(operation="ingest", payload=job_payload)
        self.update_results(job_id=response["id"], payload=csv_data)
        self.close_job(job_id=response["id"], operation="ingest")
        self.wait_for_batch(job_id=response["id"], job_type="ingest")
        response = self.bulk_job_results(job_id=response["id"])
        return response

    @staticmethod
    def convert_json_to_csv(fieldnames, data):
        """json to csv"""
        csv_file = StringIO()
        csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        csv_writer.writeheader()
        csv_writer.writerows(data)
        return csv_file.getvalue()

    @staticmethod
    def get_salesforce_mapping(tenant_id, s_object):
        """Retrieve the Salesforce mapping for a specific object and tenant_id"""
        logger.info("Getting the mapping for %s and tenant_id %s", s_object, tenant_id)
        field_mapping = SalesforceMappingModel.objects.filter(
            name=s_object, is_deleted=False, tenant_id=tenant_id
        ).first()
        if not field_mapping:
            logger.info(f"No mapping found for tenant_id: {tenant_id}")
            return None, None

        sf_columns = json.loads(field_mapping.sf_column_mapping)
        monetizely_columns = json.loads(field_mapping.m_column_mapping)
        config = json.loads(field_mapping.config) if field_mapping.config else None

        sf_source_fields = [mapping["Source_Field__c"] for mapping in sf_columns]
        sf_destination_fields = [
            mapping["Destination_Field__c"] for mapping in sf_columns
        ]

        monetizely_source_fields = [
            mapping["Source_Field__c"] for mapping in monetizely_columns
        ]
        monetizely_destination_fields = [
            mapping["Destination_Field__c"] for mapping in monetizely_columns
        ]

        sf_field_mapping = dict(zip(sf_source_fields, sf_destination_fields))
        monetizely_field_mapping = dict(
            zip(monetizely_source_fields, monetizely_destination_fields)
        )
        return {
            "salesforce_field_mapping": sf_field_mapping,
            "monetizely_field_mapping": monetizely_field_mapping,
            "config": config,
        }

    @staticmethod
    def convert_value(value, conversion_type):
        """Convert values from Salesforce"""

        if conversion_type == bool:
            return value == "Yes"

        if conversion_type == "None" or value == "":
            return None

        if conversion_type == int:
            # Check if the value is in scientific notation format
            if "E" in value:
                return int(float(value))
            else:
                try:
                    # Attempt to convert to int directly
                    return int(round(float(value)))
                except ValueError:
                    # If the value is a float represented as a string, round it up
                    return int(round(float(value)))

        if conversion_type == float:
            return float(value)

        return conversion_type(value)

    @staticmethod
    def _get_account(salesforce_id):
        """Get Account data"""
        account = Account.objects.filter(account_ext_id=salesforce_id).first()
        return account if account else None

    @staticmethod
    def _get_contract(salesforce_id):
        """Get Contract data"""
        contract = Contract.objects.filter(contract_external_id=salesforce_id).first()
        return contract if contract else None

    @staticmethod
    def _get_industry(name, tenant):
        """Get Account Industry"""
        industry, _ = IndustryType.objects.get_or_create(
            name=name,
            is_deleted=False,
            tenant_id=tenant.id,
            defaults={"name": name, "tenant_id": tenant},
        )
        return industry

    @staticmethod
    def _get_opportunity_stage(name, tenant):
        """Get opportunity stage"""
        stage, _ = OpportunityStage.objects.get_or_create(
            name=name,
            is_deleted=False,
            tenant_id=tenant.id,
            defaults={"name": name, "tenant_id": tenant},
        )

        return stage

    @staticmethod
    def _get_opportunity_type(name, tenant):
        """Get opportunity type"""
        op_type, _ = OpportunityType.objects.get_or_create(
            name=name,
            is_deleted=False,
            tenant_id=tenant.id,
            defaults={"name": name, "tenant_id": tenant},
        )
        return op_type

    def sync_account(self, tenant_id, logged_in_user, account_ids):
        """Sync Account"""
        try:
            logger.info("Accounts sync started.")
            mapping = self.get_salesforce_mapping(
                tenant_id=tenant_id, s_object="Account"
            )
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
            account_ids = tuple(account_ids)
            query = f"SELECT {', '.join(sf_source_fields)} FROM Account WHERE Account.Id IN {account_ids}"
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(job_id=response["id"])
            accounts = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(accounts))
            account_list = json.loads(json.dumps(list(reader)))
            account_existing_ids = Account.objects.filter(
                tenant_id=tenant_id
            ).values_list("account_ext_id", flat=True)
            salesforce_user_ids = set()
            for record in account_list:
                record["Active__c"] = self.convert_value(record["Active__c"], bool)
                record["AnnualRevenue"] = self.convert_value(
                    record["AnnualRevenue"], int
                )
                record["NumberOfEmployees"] = self.convert_value(
                    record["NumberOfEmployees"], int
                )
                record["LastModifiedDate"] = datetime.strptime(
                    record.get("LastModifiedDate", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                salesforce_user_ids.update([record["OwnerId"], record["CreatedById"]])

            users = User.objects.filter(id_ext_key__in=list(salesforce_user_ids))
            salesforce_monetizely_user_mapping = {
                user.id_ext_key: User.objects.get(id=user.id) for user in users
            }
            bulk_create_accounts = []
            bulk_update_accounts = []
            for record in account_list:
                external_id = record["Id"]
                account_data = {}
                for sf_field, destination_field in sf_field_mapping.items():
                    field_value = record.get(sf_field)
                    if field_value == "":
                        account_data[destination_field] = None
                    elif sf_field == "Industry":
                        account_data[destination_field] = self._get_industry(
                            name=field_value, tenant=tenant
                        )
                    elif sf_field in ["OwnerId", "CreatedById", "ModifiedById"]:
                        account_data[destination_field] = record.get(
                            salesforce_monetizely_user_mapping.get(
                                sf_field, logged_in_user
                            )
                        )
                    else:
                        account_data[destination_field] = field_value

                account_data["tenant_id"] = tenant

                if external_id in account_existing_ids:
                    bulk_update_accounts.append(account_data)
                else:
                    bulk_create_accounts.append(Account(**account_data))

            if bulk_create_accounts:
                inserted_accounts = Account.objects.bulk_create(bulk_create_accounts)
                data = [
                    {"Id": item.account_ext_id, "Account_ext_key__c": str(item.id)}
                    for item in inserted_accounts
                ]
                fieldnames = list(mapping["monetizely_field_mapping"].values())

                # Check if 'Id' is already in fieldnames list
                if "Id" not in fieldnames:
                    fieldnames.append("Id")
                csv_data = self.convert_json_to_csv(fieldnames=fieldnames, data=data)
                self.bulk_upsert_data(
                    s_object="Account", external_id_field_name="Id", csv_data=csv_data
                )

            if bulk_update_accounts:
                accounts_to_update = []
                existing_accounts = Account.objects.filter(
                    tenant_id=tenant_id,
                    account_ext_id__in=[
                        data["account_ext_id"] for data in bulk_update_accounts
                    ],
                )

                for data in bulk_update_accounts:
                    external_id = data["account_ext_id"]
                    existing_account = existing_accounts.get(account_ext_id=external_id)
                    is_modified = False
                    if existing_account.updated_on < data["updated_on"]:
                        for field, value in data.items():
                            setattr(existing_account, field, value)
                            is_modified = True

                    if is_modified:
                        accounts_to_update.append(existing_account)

                Account.objects.bulk_update(
                    accounts_to_update,
                    [
                        field
                        for field in sf_field_mapping.values()
                        if field != "account_ext_id"
                    ],
                )
            logger.info("Accounts synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing Accounts %s", err)
            logger.info("**************ERROR*************************\n")

    def sync_quote(self, tenant_id, logged_in_user):
        """Syncs quotes from the local database to Salesforce.

        Args:
            tenant_id (int): The ID of the tenant.
            logged_in_user (str): The username of the logged-in user.

        Returns:
            None
        """
        try:
            logger.info("Quotes sync started.")

            # Get Salesforce mapping for quotes
            mapping = self.get_salesforce_mapping(tenant_id=tenant_id, s_object="Quote")
            m_field_mapping = mapping["monetizely_field_mapping"]

            # Get Monetizely mapping for quotes
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]

            # Retrieve tenant information
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)

            # Get Quotes data from Salesforce
            query = f"SELECT {', '.join(sf_source_fields)} FROM Quote__c"
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(job_id=response["id"])
            quotes = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(quotes))
            sf_quotes_list = json.loads(json.dumps(list(reader)))
            sf_quote_dict = {
                sf_quote.get("Id"): sf_quote for sf_quote in sf_quotes_list
            }

            # Retrieve quotes from the local database
            quotes_list = Quote.objects.filter(tenant_id=tenant)
            quotes_dict = {str(quote.quote_number): quote for quote in quotes_list}
            quotes_id_number_dict = {
                quote.quote_number: str(quote.id) for quote in quotes_list
            }

            # Retrieve associated accounts for the quotes
            account_ids = [
                item.account_id.id
                for item in quotes_list
                if item.account_id.account_ext_id
            ]
            accounts = Account.objects.filter(
                id__in=account_ids, tenant_id=tenant, account_ext_id__isnull=False
            )
            account_dict = {str(item.id): item.account_ext_id for item in accounts}

            # Retrieve associated opportunities for the quotes
            opportunity_ids = [
                item.opportunity_id.id
                for item in quotes_list
                if item.opportunity_id.op_external_id
            ]
            opportunity = Opportunity.objects.filter(
                id__in=opportunity_ids,
                tenant_id=tenant_id,
                op_external_id__isnull=False,
            )
            opportunity_dict = {
                str(item.id): item.op_external_id for item in opportunity
            }

            bulk_insert_quotes = []
            bulk_update_quotes = []

            # Dynamically mapping all the fields and removing the optional fields
            required_fields = list(m_field_mapping.values())
            required_fields.remove("Discount__c")

            # Set a field which will be unique and make mappings around that

            # Process each quote
            for quote in quotes_list:
                data = {}
                quote_temp = QuoteSerializer(quote).data

                # Map the fields from the local quote to Salesforce fields
                for m_field, destination_field in m_field_mapping.items():
                    if m_field == "opportunity_id":
                        opportunity_id = str(quote_temp.get(m_field))
                        if opportunity_id:
                            data[destination_field] = opportunity_dict.get(
                                opportunity_id
                            )
                        else:
                            data[destination_field] = None
                    elif m_field == "account_id":
                        account_id = str(quote_temp.get(m_field))
                        if account_id:
                            data[destination_field] = account_dict.get(account_id)
                        else:
                            data[destination_field] = None
                    elif m_field == "id":
                        data[destination_field] = str(quote_temp.get(m_field))
                    else:
                        data[destination_field] = quote_temp.get(m_field)
                account_data = {
                    "Contact_Name__c": quote.account_id.contact_name
                    if quote.account_id.contact_name
                    else None,
                    "Email__c": quote.account_id.email
                    if quote.account_id.email
                    else None,
                    "Quote_To_Name__c": quote.account_id.contact_name
                    if quote.account_id.contact_name
                    else None,
                    "Quote_To__c": quote.account_id.quote_to_address
                    if quote.account_id.quote_to_address
                    else None,
                    "BillingName__c": quote.account_id.bill_to_name
                    if quote.account_id.bill_to_name
                    else None,
                    "ShippingName__c": quote.account_id.ship_to_name
                    if quote.account_id.ship_to_name
                    else None,
                    "LastModifiedDate": quote.updated_on,
                }
                data.update(account_data)
                if quote_temp.get("quote_external_id"):
                    # Check Updated date on database and Salesforce
                    external_id = quote_temp.get("quote_external_id")
                    sf_quote_object = sf_quote_dict.get(external_id)
                    if sf_quote_object:
                        if quote_temp.get("updated_on") > sf_quote_object.get(
                            "LastModifiedDate"
                        ):
                            data.pop("LastModifiedDate")
                            bulk_update_quotes.append(data)
                else:
                    if not any(data[key] is None for key in required_fields):
                        data.pop("LastModifiedDate")
                        bulk_insert_quotes.append(data)

            if bulk_insert_quotes:
                # Bulk insert new quotes into Salesforce
                fieldnames = list(bulk_insert_quotes[0].keys())
                csv_data = self.convert_json_to_csv(
                    fieldnames=fieldnames, data=bulk_insert_quotes
                )
                quote_response = self.bulk_insert(
                    s_object="Quote__c", csv_data=csv_data
                )

                # Process the response and update the local quotes with Salesforce IDs
                reader = csv.reader(quote_response.splitlines())
                header = next(reader, None)
                sf_id_index = header.index("sf__Id")
                quote_number_index = header.index("Quote_Number__c")
                bulk_update_list = []

                for row in reader:
                    quote_instance = quotes_dict.get(row[quote_number_index])
                    quote_instance.quote_external_id = row[sf_id_index]
                    quote_instance.id = quotes_id_number_dict[row[quote_number_index]]
                    bulk_update_list.append(quote_instance)
                Quote.objects.bulk_update(bulk_update_list, ["quote_external_id"])

            if bulk_update_quotes:
                # Bulk upsert existing quotes in Salesforce
                fieldnames = list(bulk_update_quotes[0].keys())
                update_csv_data = self.convert_json_to_csv(
                    fieldnames=fieldnames, data=bulk_update_quotes
                )
                self.bulk_upsert_data(
                    s_object="Quote__c",
                    external_id_field_name="Id",
                    csv_data=update_csv_data,
                )

            logger.info("Quote synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing Quotes %s", err)
            logger.info("**************ERROR*************************\n")

    def sync_contract(self, tenant_id, logged_in_user, contract_ids, account_ids):
        """Sync Contracts"""
        try:
            logger.info("Contracts sync started.")
            mapping = self.get_salesforce_mapping(
                tenant_id=tenant_id, s_object="Contract"
            )
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]
            m_field_mapping = mapping["monetizely_field_mapping"]
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
            contract_ids = (
                tuple(contract_ids)
                if len(contract_ids) > 1
                else f"('{contract_ids[0]}')"
            )
            query = f"SELECT {', '.join(sf_source_fields)} FROM Contract WHERE Contract.Id IN {contract_ids}"
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(job_id=response["id"])
            contracts = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(contracts))
            contract_list = json.loads(json.dumps(list(reader)))
            self.delete_job(job_id=response["id"], operation="query")
            existing_external_ids = Contract.objects.filter(
                tenant_id=tenant_id
            ).values_list("contract_external_id", flat=True)

            account_list = [
                account["AccountId"]
                for account in contract_list
                if account["AccountId"]
            ]

            if account_list:
                account_ids.update(account_list)

            self.sync_account(
                tenant_id=tenant_id,
                logged_in_user=logged_in_user,
                account_ids=account_ids,
            )

            contract_date_attr = [
                "CompanySignedDate",
                "CustomerSignedDate",
                "EndDate",
                "StartDate",
            ]

            salesforce_user_ids = set()
            for record in contract_list:
                record.update(
                    {
                        key: make_aware(datetime.strptime(record[key], "%Y-%m-%d"))
                        if record.get(key)
                        else None
                        for key in contract_date_attr
                    }
                )
                record["ActivatedDate"] = (
                    datetime.strptime(
                        record.get("ActivatedDate", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    if record["ActivatedDate"]
                    else None
                )
                record["LastModifiedDate"] = datetime.strptime(
                    record.get("LastModifiedDate", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )

            users = User.objects.filter(id_ext_key__in=list(salesforce_user_ids))
            salesforce_monetizely_user_dict = {
                user.id_ext_key: User.objects.get(id=user.id) for user in users
            }
            bulk_contract_create_data = []
            bulk_contract_update_data = []

            for record in contract_list:
                external_id = record["Id"]
                contract_data = {}
                for sf_field, destination_field in sf_field_mapping.items():
                    field_value = record.get(sf_field)
                    if field_value == "":
                        contract_data[destination_field] = None
                    elif sf_field == "AccountId":
                        contract_data[destination_field] = self._get_account(
                            salesforce_id=field_value
                        )
                    elif sf_field in [
                        "OwnerId",
                        "CreatedById",
                        "ModifiedById",
                    ]:
                        contract_data[destination_field] = record.get(
                            salesforce_monetizely_user_dict.get(
                                sf_field, logged_in_user
                            )
                        )
                    else:
                        contract_data[destination_field] = field_value

                contract_data["tenant_id"] = tenant
                if external_id in existing_external_ids:
                    bulk_contract_update_data.append(contract_data)
                else:
                    if not bulk_contract_create_data:
                        latest_contract = ContractViewSet.generate_contract_number(
                            tenant.id
                        )
                        contract_data["contract_number"] = latest_contract
                    else:
                        number_part = int(latest_contract[2:])
                        next_number_part = number_part + 1
                        latest_contract = f"C_{str(next_number_part).zfill(6)}"
                        contract_data["contract_number"] = latest_contract
                    bulk_contract_create_data.append(Contract(**contract_data))
            if bulk_contract_create_data:
                inserted_contracts = Contract.objects.bulk_create(
                    bulk_contract_create_data
                )
                data = [
                    {
                        "Id": item.contract_external_id,
                        "Contract_ExternalKey__C": str(item.contract_number),
                    }
                    for item in inserted_contracts
                ]
                fieldnames = ["Id", "Contract_ExternalKey__C"]

                # Check if 'Id' is already in fieldnames list
                if "Id" not in fieldnames:
                    fieldnames.append("Id")

                csv_data = self.convert_json_to_csv(fieldnames=fieldnames, data=data)
                self.bulk_upsert_data(
                    s_object="Contract", external_id_field_name="Id", csv_data=csv_data
                )
            if bulk_contract_update_data:
                contract_to_update = []
                existing_contracts = Contract.objects.filter(
                    tenant_id=tenant_id,
                    contract_external_id__in=[
                        data["contract_external_id"]
                        for data in bulk_contract_update_data
                    ],
                )

                for data in bulk_contract_update_data:
                    external_id = data["contract_external_id"]
                    existing_contract = existing_contracts.get(
                        contract_external_id=external_id
                    )
                    is_modified = False
                    if existing_contract.updated_on < data["updated_on"]:
                        for field, value in data.items():
                            setattr(existing_contract, field, value)
                            is_modified = True

                    if is_modified:
                        contract_to_update.append(existing_contract)
                Contract.objects.bulk_update(
                    contract_to_update,
                    [
                        field
                        for field in sf_field_mapping.values()
                        if field != "contract_external_id"
                    ],
                )
            existing_contracts = Contract.objects.filter(
                contract_external_id__isnull=False
            )
            if contracts:
                data = []
                for item in existing_contracts:
                    record_ = {}
                    contract = ContractSerializer(item).data
                    for m_field, destination_field in m_field_mapping.items():
                        if m_field in [
                            "start_date",
                            "end_date",
                            "customer_signed_date",
                            "company_signed_date",
                        ] and contract.get(m_field):
                            record_[destination_field] = datetime.strptime(
                                contract.get(m_field)[0:10], "%Y-%m-%d"
                            ).strftime("%Y-%m-%d")
                        else:
                            record_[destination_field] = contract.get(m_field)
                    data.append(record_)
                fieldnames = list(mapping["monetizely_field_mapping"].values())
                csv_data = self.convert_json_to_csv(fieldnames=fieldnames, data=data)
                self.bulk_upsert_data(
                    s_object="Contract", external_id_field_name="Id", csv_data=csv_data
                )
            logger.info("Contracts synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing Contract %s", err)
            logger.info("**************ERROR*************************\n")

    def sync_opportunity(self, tenant_id, logged_in_user):
        """Sync opportunities"""
        try:
            logger.info("Opportunity sync started.")
            mapping = self.get_salesforce_mapping(
                tenant_id=tenant_id, s_object="Opportunity"
            )
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
            cut_off_date = mapping["config"][0]["CreatedDate"]
            cut_off_date_formatted = datetime.strptime(
                cut_off_date, "%Y-%m-%d"
            ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
            query = f"SELECT {', '.join(sf_source_fields)} FROM Opportunity WHERE Opportunity.CreatedDate >= {cut_off_date_formatted} "
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(response["id"])

            opportunities = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(opportunities))
            opportunities_list = json.loads(json.dumps(list(reader)))
            self.delete_job(job_id=response["id"], operation="query")

            account_list = [
                account["AccountId"]
                for account in opportunities_list
                if account["AccountId"]
            ]
            required_accounts = set()
            if account_list:
                required_accounts.update(account_list)

            contract_list = [
                contract["ContractId"]
                for contract in opportunities_list
                if contract["ContractId"]
            ]
            if contract_list:
                self.sync_contract(
                    tenant_id=tenant_id,
                    logged_in_user=logged_in_user,
                    contract_ids=contract_list,
                    account_ids=required_accounts,
                )
            else:
                self.sync_account(
                    tenant_id=tenant_id,
                    logged_in_user=logged_in_user,
                    account_ids=required_accounts,
                )
            existing_external_ids = Opportunity.objects.filter(
                tenant_id=tenant_id
            ).values_list("op_external_id", flat=True)
            salesforce_user_ids = set()

            for record in opportunities_list:
                record["CloseDate"] = make_aware(
                    datetime.strptime(record["CloseDate"], "%Y-%m-%d")
                )
                record["LastModifiedDate"] = datetime.strptime(
                    record.get("LastModifiedDate", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                record["Amount"] = self.convert_value(record["Amount"], float)
                salesforce_user_ids.update([record["OwnerId"], record["CreatedById"]])

            users = User.objects.filter(id_ext_key__in=list(salesforce_user_ids))
            salesforce_monetizely_user_dict = {
                user.id_ext_key: User.objects.get(id=user.id) for user in users
            }
            bulk_opportunity_create_data = []
            bulk_opportunity_update_data = []
            for record in opportunities_list:
                external_id = record["Id"]
                opportunity_data = {}
                for sf_field, destination_field in sf_field_mapping.items():
                    field_value = record.get(sf_field)
                    if field_value == "":
                        opportunity_data[destination_field] = None
                    elif sf_field == "StageName":
                        opportunity_data[
                            destination_field
                        ] = self._get_opportunity_stage(name=field_value, tenant=tenant)
                    elif sf_field == "AccountId":
                        opportunity_data[destination_field] = self._get_account(
                            salesforce_id=field_value
                        )
                    elif sf_field == "ContractId":
                        contract_id = field_value
                        opportunity_data["contract_id"] = self._get_contract(
                            salesforce_id=contract_id
                        )
                        opportunity_data[destination_field] = record.get(sf_field)
                    elif sf_field == "Type":
                        type_name = field_value
                        opportunity_data[
                            destination_field
                        ] = self._get_opportunity_type(name=type_name, tenant=tenant)
                    elif sf_field in ["OwnerId", "CreatedById", "ModifiedById"]:
                        user_id_value = field_value
                        # Check for empty string and map to None
                        opportunity_data[destination_field] = record.get(
                            salesforce_monetizely_user_dict.get(
                                sf_field, logged_in_user
                            )
                        )
                    else:
                        opportunity_data[destination_field] = field_value

                opportunity_data["tenant_id"] = tenant
                if external_id in existing_external_ids:
                    bulk_opportunity_update_data.append(opportunity_data)
                else:
                    bulk_opportunity_create_data.append(Opportunity(**opportunity_data))

            if bulk_opportunity_create_data:
                inserted_opportunities = Opportunity.objects.bulk_create(
                    bulk_opportunity_create_data
                )
                data = [
                    {"Id": item.op_external_id, "OP_ExternalKey__c": str(item.id)}
                    for item in inserted_opportunities
                ]
                fieldnames = list(mapping["monetizely_field_mapping"].values())

                # Check if 'Id' is already in fieldnames list
                if "Id" not in fieldnames:
                    fieldnames.append("Id")

                csv_data = self.convert_json_to_csv(fieldnames=fieldnames, data=data)
                self.bulk_upsert_data(
                    s_object="Opportunity",
                    external_id_field_name="Id",
                    csv_data=csv_data,
                )
            if bulk_opportunity_update_data:
                opportunities_to_update = []
                existing_opportunities = Opportunity.objects.filter(
                    tenant_id=tenant_id,
                    op_external_id__in=[
                        data["op_external_id"] for data in bulk_opportunity_update_data
                    ],
                )

                for data in bulk_opportunity_update_data:
                    external_id = data["op_external_id"]
                    existing_opportunity = existing_opportunities.get(
                        op_external_id=external_id
                    )
                    is_modified = False
                    if existing_opportunity.updated_on < data["updated_on"]:
                        for field, value in data.items():
                            setattr(existing_opportunity, field, value)
                            is_modified = True

                    if is_modified:
                        opportunities_to_update.append(existing_opportunity)
                Opportunity.objects.bulk_update(
                    opportunities_to_update,
                    [
                        field
                        for field in sf_field_mapping.values()
                        if field != "op_external_id"
                    ],
                )
            # Get all the opportunities for which contract ID is null
            existing_opportunities = Opportunity.objects.filter(
                contract_id__isnull=True, op_external_id__isnull=False
            )
            if existing_opportunities:
                data = []
                for item in existing_opportunities:
                    quotes = (
                        Quote.objects.filter(
                            opportunity_id=item.id, contract_id__isnull=False
                        )
                        .order_by("-created_on")
                        .first()
                    )
                    if quotes:
                        contract = Contract.objects.filter(
                            id=quotes.contract_id.id
                        ).first()
                        contract = ContractSerializer(contract).data
                        record_ = {
                            "Contract_ExternalKey__c": contract.get(
                                "contract_number", ""
                            ),
                            "ContractLink__c": contract.get("contract_url", ""),
                            "Id": item.op_external_id,
                        }
                        data.append(record_)
                fieldnames = ["Id", "Contract_ExternalKey__c", "ContractLink__c"]
                if data:
                    csv_data = self.convert_json_to_csv(
                        fieldnames=fieldnames, data=data
                    )
                    self.bulk_upsert_data(
                        s_object="Opportunity",
                        external_id_field_name="Id",
                        csv_data=csv_data,
                    )
            logger.info("Opportunities synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing Opportunity %s", err)
            logger.info("**************ERROR*************************\n")

    def sync_user_hierarchy(self, tenant_id):
        """
        Synchronize user hierarchy for a specific tenant.

        Steps:
        1. Fetch the user roles from Salesforce for the specified tenant.
        2. Update or create OrgHierarchy objects based on the fetched data.

        Args:
            tenant_id (int): ID of the tenant.

        """
        try:
            logger.info("Org Hierarchy sync started.")
            mapping = self.get_salesforce_mapping(
                tenant_id=tenant_id, s_object="OrgHierarchy"
            )
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
            query = f"SELECT {', '.join(sf_source_fields)} FROM userrole"
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(job_id=response["id"])
            hierarchy = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(hierarchy))
            hierarchy_list = list(reader)

            org_hierarchy_dict = {}
            org_hierarchy_ids = set()  # These will be used to delete the records

            # Fetch all existing OrgHierarchy objects
            existing_orgs = OrgHierarchy.objects.filter(
                tenant_id=tenant_id, is_deleted=False
            )
            existing_external_ids = OrgHierarchy.objects.filter(
                tenant_id=tenant_id
            ).values_list("id_ext_key", flat=True)

            for org in existing_orgs:
                org_hierarchy_dict[org.id_ext_key] = org

            bulk_create_hierarchy = []
            bulk_update_hierarchy = []
            bulk_create_waiting_list = (
                []
            )  # List to store fields that are not updated yet

            field_names = set()

            for record in hierarchy_list:
                external_id = record["Id"]
                hierarchy_data = {}

                for sf_field, destination_field in sf_field_mapping.items():
                    field_value = record.get(sf_field)
                    if sf_field == "ParentRoleId":
                        parent_external_id = field_value
                        # Check for empty string and map to None
                        if parent_external_id == "":
                            parent_obj = None
                        elif parent_external_id in org_hierarchy_dict:
                            parent_obj = org_hierarchy_dict[parent_external_id]
                        else:
                            parent_obj = None

                        hierarchy_data["parent_id"] = parent_obj
                        hierarchy_data["parent_role_ext_key"] = parent_external_id
                    elif destination_field == "updated_on":
                        updated_on_value = field_value
                        # Check for empty string and map to None
                        hierarchy_data["updated_on"] = datetime.strptime(
                            updated_on_value, "%Y-%m-%dT%H:%M:%S.%f%z"
                        )
                    else:
                        # Check for empty string and map to None
                        hierarchy_data[destination_field] = (
                            None if field_value == "" else field_value
                        )
                        field_names.add(destination_field)

                hierarchy_data["tenant_id"] = tenant
                org_hierarchy_ids.add(external_id)

                if external_id in existing_external_ids:
                    if org_hierarchy_dict[external_id].updated_on < hierarchy_data.get(
                        "updated_on"
                    ):
                        bulk_update_hierarchy.append(
                            org_hierarchy_dict[external_id]
                        )  # Append the hierarchy object
                        org_hierarchy_dict[external_id].__dict__.update(
                            hierarchy_data
                        )  # Update hierarchy object's attributes
                else:
                    hierarchy_obj = OrgHierarchy(**hierarchy_data)
                    bulk_create_hierarchy.append(hierarchy_obj)
                    org_hierarchy_dict[
                        external_id
                    ] = hierarchy_obj  # Store hierarchy object in org_hierarchy_dict

                    # Add the fields that are not updated to the waiting list
                    waiting_data = {
                        "external_id": external_id,
                        "destination_field": sf_field_mapping.get(sf_field),
                        "hierarchy_obj": hierarchy_obj,
                    }
                    bulk_create_waiting_list.append(waiting_data)

            # Bulk create hierarchy objects
            OrgHierarchy.objects.bulk_create(bulk_create_hierarchy)

            # Process the waiting list and update the hierarchy objects
            for waiting_data in bulk_create_waiting_list:
                external_id = waiting_data["external_id"]
                destination_field = waiting_data["destination_field"]
                hierarchy_obj = waiting_data["hierarchy_obj"]

                # Update the specific field in the hierarchy object
                setattr(
                    hierarchy_obj,
                    destination_field,
                    org_hierarchy_dict.get(external_id),
                )

            # Bulk update hierarchy objects
            OrgHierarchy.objects.bulk_update(
                bulk_update_hierarchy, fields=list(field_names)
            )

            # Mark hierarchies as deleted if their external IDs are not in existing_org_ext_keys
            OrgHierarchy.objects.filter(tenant_id=tenant_id).exclude(
                id_ext_key__in=org_hierarchy_ids
            ).update(
                is_deleted=True,
                id_ext_key=None,
                parent_role_ext_key=None,
                parent_id=None,
            )

            logger.info("Org Hierarchy synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing Org Hierarchy %s", err)
            logger.info("**************ERROR*************************\n")

    def sync_user_data(self, tenant_id):
        """
        Synchronize user data for a specific tenant.

        Steps:
        1. Fetch the user data from Salesforce for the specified tenant.
        2. Create/Update User Data objects based on the fetched data.
        3. Create/Update UserRoleMapping for a user.

        Args:
            tenant_id (int): ID of the tenant.
        """
        try:
            # Step 1: Fetch user data from Salesforce
            logger.info("User data sync started.")
            mapping = self.get_salesforce_mapping(tenant_id=tenant_id, s_object="User")
            sf_source_fields = mapping["salesforce_field_mapping"].keys()
            sf_field_mapping = mapping["salesforce_field_mapping"]
            tenant = Tenant.objects.get(id=tenant_id, is_deleted=False)
            user_role = tuple(mapping["config"])
            query = f"SELECT {', '.join(sf_source_fields)} FROM User WHERE ProfileID IN {user_role}"
            payload = {"operation": "query", "query": query}
            response = self.create_job(operation="query", payload=payload)
            self.wait_for_batch(job_id=response["id"])
            user = self.get_results(response["id"])
            reader = csv.DictReader(io.StringIO(user))
            user_data_list = list(reader)

            # Step 2: Process and update/create User Data objects
            user_dict = {}
            org_hierarchy_ids = []

            for record in user_data_list:
                external_id = record["Id"]
                user_data = {}

                for sf_field, destination_field in sf_field_mapping.items():
                    field_value = record.get(sf_field)
                    if field_value == "":
                        user_data[destination_field] = None
                    elif destination_field == "manager_id_ext_key":
                        user_data["manager_id_ext_key"] = field_value
                    elif destination_field == "org_hierarchy_id_ext_key":
                        user_data["org_hierarchy_id_ext_key"] = field_value
                        org_hierarchy_ids.append(field_value)
                    elif destination_field == "is_active":
                        is_active_value = field_value
                        # Check for empty string and map to None
                        user_data["is_active"] = bool(is_active_value)
                    elif destination_field == "created_by":
                        # Saving in created_by_id as it's not saved in the database and will be removed later
                        user_data["created_by_id"] = field_value
                    elif destination_field == "updated_by":
                        # Saving in updated_by_id as it's not saved in the database and will be removed later
                        user_data["updated_by_id"] = field_value
                    elif destination_field == "updated_on":
                        updated_on_value = field_value
                        # Check for empty string and map to None
                        user_data["updated_on"] = datetime.strptime(
                            updated_on_value, "%Y-%m-%dT%H:%M:%S.%f%z"
                        )
                    else:
                        user_data[destination_field] = field_value

                user_data["tenant_id"] = tenant
                user_dict[external_id] = user_data

            # Fetch existing user IDs and managers
            existing_user_ids = set(
                User.objects.filter(
                    id_ext_key__in=user_dict.keys(),
                    tenant_id=tenant_id,
                    is_deleted=False,
                ).values_list("id_ext_key", flat=True)
            )
            existing_managers = User.objects.filter(
                tenant_id=tenant_id, is_deleted=False
            )
            user_data_dict = {
                manager.id_ext_key: manager for manager in existing_managers
            }
            existing_user_emails = {user.email: user for user in existing_managers}

            # Fetch org hierarchies
            org_hierarchy_dict = {
                org_hierarchy.id_ext_key: org_hierarchy
                for org_hierarchy in OrgHierarchy.objects.filter(
                    id_ext_key__in=org_hierarchy_ids,
                    tenant_id=tenant_id,
                    is_deleted=False,
                )
            }

            users_to_update = []
            users_update_ids = []
            user_to_create = []

            with transaction.atomic():
                for external_id, user_data in user_dict.items():
                    id_ext_key = user_data.get("id_ext_key")
                    manager_id_ext_key = user_data.get("manager_id_ext_key", None)
                    org_hierarchy_id_ext_key = user_data.get(
                        "org_hierarchy_id_ext_key", None
                    )

                    if manager_id_ext_key:
                        manager_id = user_data_dict.get(manager_id_ext_key)
                        if manager_id:
                            user_data["manager_id"] = manager_id
                            user_data["manager_id_ext_key"] = manager_id_ext_key

                    if org_hierarchy_id_ext_key:
                        org_hierarchy = org_hierarchy_dict.get(org_hierarchy_id_ext_key)
                        user_data["org_hierarchy_id"] = org_hierarchy

                    if user_data.get("created_by_id"):
                        created_by_ext_key = user_data.pop("created_by_id")
                        created_by = user_data_dict.get(created_by_ext_key)

                        if created_by:
                            user_data["created_by"] = created_by

                    if user_data.get("updated_by_id"):
                        updated_by_ext_key = user_data.pop("updated_by_id")
                        updated_by = user_data_dict.get(updated_by_ext_key)

                        if updated_by:
                            user_data["updated_by"] = updated_by

                    if (
                        id_ext_key not in existing_user_ids
                        and user_data.get("email") not in existing_user_emails
                    ):
                        created_user = User(**user_data, is_monetizely_user=False)
                        user_to_create.append(created_user)
                        user_data_dict[id_ext_key] = created_user

                    if user_data.get("email") in existing_user_emails:
                        user_instance = existing_user_emails.get(user_data.get("email"))
                        user_instance.id_ext_key = id_ext_key
                        users_update_ids.append(user_instance)
                        user_data_dict[id_ext_key] = user_instance

                # Bulk create new users
                User.objects.bulk_create(user_to_create)

                # Bulk update id_ext_keys
                User.objects.bulk_update(users_update_ids, fields=["id_ext_key"])

                # Assign 'created_by', 'updated_by' and 'manager_id' fields to created_user
                for external_id, user_data in user_dict.items():
                    id_ext_key = user_data.get("id_ext_key")
                    email = user_data.get("email")
                    updated_on = user_data.get("updated_on")
                    sf_updated_on = (
                        user_data_dict.get(id_ext_key).updated_on
                        if user_data_dict.get(id_ext_key)
                        else None
                    )

                    if not user_data.get("manager_id"):
                        manager_id = user_data_dict.get(
                            user_data.get("manager_id_ext_key")
                        )
                        if manager_id:
                            user_data["manager_id"] = manager_id

                    if user_data.get("created_by_id"):
                        created_by_ext_key = user_data.pop("created_by_id")
                        created_by = user_data_dict.get(created_by_ext_key)

                        if created_by:
                            user_data["created_by"] = created_by

                    if user_data.get("updated_by_id"):
                        updated_by_ext_key = user_data.pop("updated_by_id")
                        updated_by = user_data_dict.get(updated_by_ext_key)

                        if updated_by:
                            user_data["updated_by"] = updated_by

                    if email in existing_user_emails:
                        user_instance = existing_user_emails.get(email)
                        for field, value in user_data.items():
                            setattr(user_instance, field, value)
                        users_to_update.append(user_instance)
                        continue

                    if sf_updated_on is None or updated_on < sf_updated_on:
                        if id_ext_key in existing_user_ids:
                            user_instance = user_data_dict.get(id_ext_key)
                            for field, value in user_data.items():
                                setattr(user_instance, field, value)
                            users_to_update.append(user_instance)

                # Include additional fields that are not in sf_field_mapping
                update_fields = list(sf_field_mapping.values()) + [
                    "manager_id",
                    "org_hierarchy_id",
                    "created_by",
                    "updated_by",
                ]

                # Bulk update existing users
                User.objects.bulk_update(users_to_update, fields=update_fields)

            logger.info("User data synced successfully!")
        except Exception as err:
            logger.info("************ERROR**************************")
            logger.exception("Error while syncing User %s", err)
            logger.info("**************ERROR*************************")

    def start_sync(self, tenant_id, logged_in_user):
        """Start salesforce sync"""
        logger.info("Calling start sync method")
        job_details = AwsDynamodb.get_item(
            key={"tenant_id": str(tenant_id)}, table_name="jobs"
        )
        logger.info(job_details)
        if not job_details:
            logger.info("Creating a job in dynamo db for tenant_id %s", str(tenant_id))
            AwsDynamodb.add_item(
                form_data={"tenant_id": str(tenant_id), "completed": False},
                table_name="jobs",
            )
            job_details = AwsDynamodb.get_item(
                key={"tenant_id": str(tenant_id)}, table_name="jobs"
            )
        job_status = job_details["completed"]
        if not job_status:
            AwsDynamodb.add_item(
                form_data={"tenant_id": str(tenant_id), "completed": True},
                table_name="jobs",
            )
            self.sync_user_hierarchy(tenant_id=tenant_id)
            self.sync_user_data(tenant_id=tenant_id)
            self.sync_opportunity(tenant_id=tenant_id, logged_in_user=logged_in_user)
            self.sync_quote(tenant_id=tenant_id, logged_in_user=logged_in_user)
            AwsDynamodb.add_item(
                form_data={"tenant_id": str(tenant_id), "completed": False},
                table_name="jobs",
            )


class SalesforceSync(GenericAPIView):
    """Salesforce Sync API"""

    authentication_classes = [CognitoAuthentication]

    secret_id = os.getenv("SALESFORCE_CONFIG_SECRET_ID")

    def post(self, request):
        """Salesforce sync post api"""
        logger.info("Salesforce sync triggered %s", request.data)
        cron_job = request.query_params.get("job_type")
        logger.info("Cron job param %s", cron_job)
        if not cron_job:
            logger.info("Manual Sync started!")
            tenant_id = get_tenant_id_from_email(request.user[0])
            logged_in_user = User.objects.filter(email=request.user[0]).first()
            config = AwsSecret.get(secret_id=SalesforceSync.secret_id)[str(tenant_id)]
            salesforce = Salesforce(config)
            salesforce.start_sync(tenant_id=tenant_id, logged_in_user=logged_in_user)
            logger.info("Manual Sync was done successfully.")
            return ResponseBuilder.success(
                data="Job Executed",
                status_code=status.HTTP_200_OK,
            )
        else:
            logger.info("Cron job started!")
            tenants = Tenant.objects.all()
            for tenant in tenants:
                logged_in_user = User.objects.filter(email=request.user[0]).first()
                config = AwsSecret.get(secret_id=SalesforceSync.secret_id).get(
                    str(tenant.id), ""
                )
                if config:
                    logger.info("Job started for tenant id %s", str(tenant.id))
                    salesforce = Salesforce(config)
                    salesforce.start_sync(
                        tenant_id=tenant.id, logged_in_user=logged_in_user
                    )
            return ResponseBuilder.success(
                data="Job Executed",
                status_code=status.HTTP_200_OK,
            )

    def get(self, request):
        salesforce_sync_url = os.getenv("SALESFORCE_SYNC_URL")
        headers = {
            "Invocation-Type": "Event",
            "Authorization": request.META["HTTP_AUTHORIZATION"],
        }
        requests.post(salesforce_sync_url, headers=headers, data={})
        return ResponseBuilder.success(
            data="Job Executed",
            status_code=status.HTTP_200_OK,
        )
