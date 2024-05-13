import datetime
import os

from dropbox_sign import ApiClient, ApiException, Configuration, apis, models


class HelloSign:
    def __init__(self):
        self.configuration = Configuration(username=os.getenv("HELLO_SIGN_API_KEY"))

    def send_signature_request(self, request_payload):
        with ApiClient(self.configuration) as api_client:
            signature_request_api = apis.SignatureRequestApi(api_client)

            signer_detail = [
                models.SubSignatureRequestSigner(
                    email_address=signer.get('email_address'),
                    name=signer.get('name'),
                    order=signer.get('order'),
                )
                for signer in request_payload.get('signers')]

            signing_options = models.SubSigningOptions(
                draw=True, type=True, upload=True, phone=True, default_type="draw")

            datetime_obj = datetime.datetime.strptime(
                request_payload.get('expires_at'), "%Y-%m-%dT%H:%M:%S.%fZ")
            epoch_time = int(datetime_obj.timestamp())

            data = models.SignatureRequestSendRequest(
                title=request_payload.get('title'),
                subject=request_payload.get('subject'),
                message=request_payload.get('message'),
                signers=signer_detail,
                files=[open(request_payload.get('file_obj'), 'rb')],
                signing_options=signing_options,
                field_options=models.SubFieldOptions(date_format="DD - MM - YYYY"),
                expires_at=epoch_time,
                use_text_tags=True,
                hide_text_tags=True,
                test_mode=True,
            )
            try:
                response = signature_request_api.signature_request_send(data)

                return response
            except ApiException as e:
                return e.body

    def check_signature_status(self, signature_request_id):
        with ApiClient(self.configuration) as api_client:
            signature_request_api = apis.SignatureRequestApi(api_client)
            try:
                response = signature_request_api.signature_request_get(signature_request_id)
                return response
            except ApiException as e:
                return e.body

    def remove_signature_request_access(self, signature_request_id):
        with ApiClient(self.configuration) as api_client:
            signature_request_api = apis.SignatureRequestApi(api_client)
            try:
                return signature_request_api.signature_request_cancel(signature_request_id)
            except ApiException as e:
                return e.body

    def download_file(self, signature_request_id):
        with ApiClient(self.configuration) as api_client:
            signature_request_api = apis.SignatureRequestApi(api_client)
            try:
                return signature_request_api.signature_request_files(signature_request_id, file_type="pdf")
            except ApiException as e:
                return e.body
