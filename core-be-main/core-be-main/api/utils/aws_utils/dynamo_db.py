from functools import reduce

import boto3
from boto3.dynamodb.conditions import And, Key
from botocore.exceptions import ClientError


class AwsDynamodb:
    """Aws Dynamo db class"""

    dynamodb_client = boto3.resource("dynamodb", region_name="us-east-1")

    @staticmethod
    def get_table(table_name):
        """
        This method would return the table object from the dynamodb client
        :param table_name:
        :return: table object
        """
        return AwsDynamodb.dynamodb_client.Table(table_name)

    @staticmethod
    def get_item(key, table_name):
        """
        Get item from dynamo db
        """
        table = AwsDynamodb.get_table(table_name)
        try:
            response = table.get_item(Key=key)
        except ClientError as err:
            print(err.response["Error"]["Message"])
            return None
        else:
            if response.get("Item"):
                return response["Item"]
            return None

    @staticmethod
    def add_item(form_data, table_name):
        """
        Add item to dynamo db
        """
        table = AwsDynamodb.get_table(table_name)
        try:
            table.put_item(Item=form_data)
        except ClientError as err:
            print(err.response["Error"]["Message"])
            raise err

    @staticmethod
    def update_item(form_data, table_name):
        """
        Update item to dynamo db
        """
        table = AwsDynamodb.get_table(table_name)
        try:
            return table.update_item(**form_data)
        except ClientError as err:
            print(err.response["Error"]["Message"])
            raise err
