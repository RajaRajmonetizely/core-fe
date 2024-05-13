import os

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from api.utils.logger import logger


class S3Service:
    BUCKET = os.getenv("S3_CONTRACT_TEMPLATE_BUCKET")
    REGION_NAME = os.getenv("REGION")
    EXPIRY = os.getenv("EXPIRY")

    @staticmethod
    def generate_presigned_url(filepath):
        try:
            s3 = boto3.client(
                "s3",
                region_name=S3Service.REGION_NAME,
                config=Config(signature_version="s3v4"),
            )

            response = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": S3Service.BUCKET, "Key": filepath},
                ExpiresIn=S3Service.EXPIRY,
            )
            return response
        except Exception as e:
            raise e

    @staticmethod
    def retrieve_s3_file_as_object(file_path):
        try:
            s3_client = boto3.client("s3")
            s3_response_object = s3_client.get_object(
                Bucket=S3Service.BUCKET, Key=file_path
            )
            return s3_response_object["Body"]
        except Exception as e:
            raise e

    @staticmethod
    def download_file_from_s3(s3_path, local_path):
        """
        Download a file from Amazon S3 to the local file system.

        Args:
            s3_path (str): The S3 object key (path) of the file to download.
            local_path (str): The local file path where the downloaded file will be saved.
        Returns:
            bool: True if the download was successful.
        """
        s3_client = boto3.client('s3')
        try:
            logger.info(f'{s3_path = }')
            s3_client.download_file(Bucket=S3Service.BUCKET, Key=s3_path, Filename=local_path)
            return True
        except Exception as e:
            raise e

    @staticmethod
    def download_file_obj_from_s3(s3_path, local_path):
        """
        Download a file from Amazon S3 to the local file system.

        Args:
            s3_path (str): The S3 object key (path) of the file to download.
            local_path (str): The local file path where the downloaded file will be saved.
        Returns:
            bool: True if the download was successful.
        """
        s3_client = boto3.client('s3')
        try:
            with open(local_path, 'wb') as local_file:
                s3_object = s3_client.get_object(Bucket=S3Service.BUCKET, Key=s3_path)
                s3_body = s3_object['Body'].read()
                local_file.write(s3_body)
            return True
        except s3_client.exceptions.NoSuchKey as e:
            raise Exception("File not found on S3")
        except Exception as e:
            raise e

    @staticmethod
    def upload_file_to_s3(file_obj, file_path):
        s3_client = boto3.client("s3")
        try:
            logger.info('Uploading file to s3 with base64 encoding')
            s3_client.upload_fileobj(
                file_obj,
                S3Service.BUCKET,
                file_path,
                ExtraArgs={
                    'ContentType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'ContentEncoding': 'base64'}
            )
            # s3_client.upload_fileobj(file_obj, S3Service.BUCKET, file_path)
            # s3_client.upload_fileobj(file_obj, S3Service.BUCKET, file_path, ExtraArgs={
            #     'ContentType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})
            logger.info("File uploaded successfully to S3: %s", file_path)
        except ClientError as e:
            raise e

    @staticmethod
    def upload_file_from_path(local_file_path, s3_file_path):
        s3_client = boto3.client("s3")
        try:
            s3_client.upload_file(local_file_path, S3Service.BUCKET, s3_file_path)
        except ClientError as e:
            raise e

    @staticmethod
    def delete_s3_object(file_path):
        s3_client = boto3.client("s3")
        try:
            s3_client.delete_object(Bucket=S3Service.BUCKET, Key=file_path)
        except ClientError as e:
            raise e
