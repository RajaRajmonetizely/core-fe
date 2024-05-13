import os
import requests


class SForceUtil:
    secret_id = os.getenv("SALESFORCE_CONFIG_SECRET_ID")

    @staticmethod
    def get_salesforce_login(config):
        client_id = config.get("client_id")
        client_secret = config.get("client_secret")
        username = config.get("username")
        password = config.get("password")

        url = (
            f"https://login.salesforce.com/services/oauth2/token?grant_type=password&client_id={client_id}"
            f"&client_secret={client_secret}&username={username}&password={password}"
        )
        payload = {}
        files = {}
        headers = {
            "Cookie": "BrowserId=AgAOoPO9Ee2mTXUMp9i4QQ; CookieConsentPolicy=0:0; LSKey-c$CookieConsentPolicy=0:0"
        }

        response = requests.request(
            "POST", url, headers=headers, data=payload, files=files
        )

        return response.json()["access_token"]
