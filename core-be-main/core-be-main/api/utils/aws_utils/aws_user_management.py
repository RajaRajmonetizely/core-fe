from http import HTTPStatus
from .base import MonetizelyAwsUtils
from botocore.exceptions import ClientError


class AwsUserManagement(MonetizelyAwsUtils):
    def add_user(self, username: str):
        try:
            resp = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {"Name": "email", "Value": username},
                    {"Name": "email_verified", "Value": "true"},
                ],
            )
            user = {"email": resp["User"].get("email")}
            user.update(
                {
                    attr.get("Name"): attr.get("Value")
                    for attr in resp["User"].get("Attributes")
                }
            )
            return HTTPStatus.OK, user
        except self.client.exceptions.UsernameExistsException as err:
            # logger.error(err)
            return HTTPStatus.BAD_REQUEST, "Username Already exists"
        except self.client.exceptions.InvalidParameterException as err:
            # logger.error(err)
            return HTTPStatus.BAD_REQUEST, "Invalid email address format"
        except self.client.exceptions.CodeDeliveryFailureException as err:
            # logger.error(err)
            return HTTPStatus.BAD_REQUEST, "Confirmation Code delivery Error"
        except ClientError as err:
            # logger.error(err)
            return HTTPStatus.INTERNAL_SERVER_ERROR, "Exception while creating user"

    def delete_user(self, username: str):
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id, Username=username
            )
            # logger.info("User - {username} deleted from cognito")
        except ClientError as err:
            pass
            # logger.error(err)

    def get_cognito_emails_for_tenant(self):
        try:
            # Fetch all users from AWS Cognito
            all_users_response = self.client.list_users(UserPoolId=self.user_pool_id)

            # Extract emails of users from Cognito
            emails = []
            for user in all_users_response.get("Users", []):
                attributes = {
                    attr["Name"]: attr["Value"] for attr in user.get("Attributes", [])
                }
                email = attributes.get("email")
                if email:
                    emails.append(email)

            return emails

        except ClientError as err:
            return []

    def disable_user(self, username: str):
        try:
            self.client.admin_disable_user(
                UserPoolId=self.user_pool_id, Username=username
            )
            # logger.info(f"User - '{username}' has been disabled in Cognito")
            return HTTPStatus.OK, "User disabled successfully"
        except self.client.exceptions.UserNotFoundException as err:
            pass
        except ClientError as err:
            # logger.error(err)
            return HTTPStatus.INTERNAL_SERVER_ERROR, "Error disabling user"

    def enable_user(self, username: str, is_user_update=False):
        try:
            # Check if the user exists
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id, Username=username
            )

            if not response.get("Enabled"):
                # If disabled, enable the user
                self.client.admin_enable_user(
                    UserPoolId=self.user_pool_id, Username=username
                )
                # logger.info(f"User - '{username}' has been enabled in Cognito")
                return HTTPStatus.OK, "User enabled successfully"
            else:
                # User is already enabled
                if is_user_update:
                    return HTTPStatus.OK, "User already enabled"
                return (
                    HTTPStatus.BAD_REQUEST,
                    "User with the given email already exists",
                )
        except self.client.exceptions.UserNotFoundException:
            # User does not exist, create the user and enable it
            return self.add_user(username=username)
        except ClientError as err:
            # logger.error(err)
            return HTTPStatus.INTERNAL_SERVER_ERROR, "Error enabling user"
