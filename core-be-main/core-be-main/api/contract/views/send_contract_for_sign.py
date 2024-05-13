import datetime
import json
import os
import _io

from django.db import transaction
from django.db.models import F
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.views import APIView

from api.account.models import Contract
from api.auth.authentication import CognitoAuthentication
from api.contract.models import ContractSignature, ContractSignerDetails, ContractSignerAudit, \
    EventDetail
from api.contract.serializers.send_contract_sign_request import SendContractSignerSerializer
from api.user.models import UserRole, UserRoleMapping
from api.user.utils import get_tenant_id_from_email, get_user_obj_from_email
from api.utils.aws_utils.s3 import S3Service
from api.utils.custom_exception_handler import ContractNotFoundException, \
    ContractSignatureNotFoundException, RoleNotFoundException, UserRoleDoesNotExistsException, \
    AccountSignerMismatchException, CustomerSignerMismatchException
from api.utils.hellosign.hello_sign import HelloSign
from api.utils.logger import logger
from api.utils.models import ESignStatus
from api.utils.responses import ResponseBuilder


class ContractView(APIView):
    serializer_class = SendContractSignerSerializer
    authentication_classes = [CognitoAuthentication]

    @swagger_auto_schema(request_body=SendContractSignerSerializer)
    @transaction.atomic
    def post(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        if not self.validate_ie_role(request.user[0], tenant_id):
            self.validate_deal_desk_role(request.user[0], tenant_id)
        request_payload = request.data

        contract_obj = Contract.objects.filter(
            id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not contract_obj:
            logger.error('contract not found for given id - %s', id)
            raise ContractNotFoundException('Contract not found')

        account_signer_details, customer_signer_details \
            = request_payload.get('account_signers'), request_payload.get('customer_signers')
        self.validate_signers_count(contract_obj, account_signer_details, customer_signer_details)

        if account_signer_details:
            contract_obj.company_signed_email = account_signer_details[0].get('email_address')
            contract_obj.company_signed_date = datetime.datetime.now()
        if customer_signer_details:
            contract_obj.customer_signed_email = customer_signer_details[0].get('email_address')
            contract_obj.customer_signed_date = datetime.datetime.now()
            contract_obj.customer_signed_title = request_payload.get('title')
        contract_obj.status = ESignStatus.Draft.value
        contract_obj.save()

        signers = self.get_signer_details(
            request_payload.get('maintain_order_at'), request_payload.get('account_signers'),
            request_payload.get('customer_signers'))
        request_payload['signers'] = signers

        temp_dir = "/tmp"
        os.makedirs(temp_dir, exist_ok=True)

        local_path = os.path.join(temp_dir, os.path.basename(contract_obj.s3_file_path))
        S3Service.download_file_obj_from_s3(contract_obj.s3_file_path, local_path)

        request_payload['file_obj'] = local_path

        contract_signature_obj = ContractSignature.objects.create(
            title=request_payload.get('title'),
            subject=request_payload.get('subject'),
            message=request_payload.get('message'),
            maintain_order_at=request_payload.get('maintain_order_at'),
            expires_at=request_payload.get('expires_at'),
            contract_id=contract_obj
        )

        contract_signer_details = [
            ContractSignerDetails(
                signer_name=signer.get('name'),
                signer_email_address=signer.get('email_address'),
                signer_type=signer.get('type'),
                order=signer.get('order'),
                contract_signature_id=contract_signature_obj
            ) for signer in signers
        ]
        contract_signer_details_obj = ContractSignerDetails.objects.bulk_create(
            contract_signer_details)

        response = HelloSign().send_signature_request(request_payload)

        data = response.get('signature_request', {})
        if data:
            self.update_contract_signature_data(contract_signature_obj, data)

            contract_signature_detail_mapping = {
                signer_obj.signer_email_address: signer_obj
                for signer_obj in contract_signer_details_obj
            }
            for signature in data.get('signatures'):
                contract_signer_details_object \
                    = contract_signature_detail_mapping.get(signature.get('signer_email_address'))
                if contract_signer_details_object:
                    contract_signer_details_object.signature_id = signature.get('signature_id')
                    contract_signer_details_object.save()
                    self.create_contract_signer_audit(contract_signer_details_object, signature)
            return ResponseBuilder.success(
                data="Request submitted successfully", status_code=status.HTTP_200_OK
            )
        error_msg = response.get('error').get('error_msg')
        if not error_msg:
            error_msg = 'Unable to submit the request'
        contract_signature_obj.status = ESignStatus.Error.value
        contract_signature_obj.save()
        contract_obj.status = ESignStatus.Error.value
        contract_obj.save()
        return ResponseBuilder.errors(
            message=error_msg,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    @staticmethod
    def validate_signers_count(contract_obj, account_signer_details, customer_signer_details):
        signer_count_obj = json.loads(contract_obj.signer_count)
        if signer_count_obj:
            if not len(account_signer_details) == signer_count_obj.get('account_signature_count'):
                contract_obj.status = ESignStatus.Error.value
                contract_obj.save()
                raise AccountSignerMismatchException("Mismatch in account signers count")
            if not len(customer_signer_details) == signer_count_obj.get('customer_signature_count'):
                contract_obj.status = ESignStatus.Error.value
                contract_obj.save()
                raise CustomerSignerMismatchException("Mismatch in customer signers count")

    @staticmethod
    def validate_ie_role(email, tenant_id):
        user_obj = get_user_obj_from_email(email)
        user_role_obj = UserRole.objects.filter(
            name='Implementation Analyst', tenant_id=tenant_id, is_deleted=False).first()
        if not user_role_obj:
            raise UserRoleDoesNotExistsException('Implementation Analyst Role not found for this tenant')
        user_role_map_obj = UserRoleMapping.objects.filter(
            user_role_id=user_role_obj.id, user_id=user_obj.id, is_deleted=False).first()
        if not user_role_map_obj:
            return False
        return True

    @staticmethod
    def validate_deal_desk_role(email, tenant_id):
        user_obj = get_user_obj_from_email(email)
        user_role_obj = UserRole.objects.filter(
            name='Deal Desk', tenant_id=tenant_id, is_deleted=False).first()
        if not user_role_obj:
            raise UserRoleDoesNotExistsException('Deal Desk Role not found for this tenant')
        user_role_map_obj = UserRoleMapping.objects.filter(
            user_role_id=user_role_obj.id, user_id=user_obj.id, is_deleted=False).first()
        if not user_role_map_obj:
            raise RoleNotFoundException('Logged user does not have deal desk role')

    @staticmethod
    def update_contract_signature_data(contract_signature_obj, data):
        contract_signature_obj.details_url = data.get('details_url')
        contract_signature_obj.files_url = data.get('files_url')
        contract_signature_obj.final_copy_uri = data.get('final_copy_uri')
        contract_signature_obj.signature_request_id = data.get('signature_request_id')
        contract_signature_obj.signing_url = data.get('signing_url')
        contract_signature_obj.has_error = data.get('has_error')
        contract_signature_obj.save()

    @staticmethod
    def create_contract_signer_audit(contract_signer_details_object, signature):
        _ = ContractSignerAudit.objects.create(
            last_viewed_at=signature.get('last_viewed_at'),
            last_reminded_at=signature.get('last_reminded_at'),
            signed_at=signature.get('signed_at'),
            status_code=signature.get('status_code'),
            error=signature.get('error'),
            contract_signer_details_id=contract_signer_details_object
        )

    @staticmethod
    def get_signer_details(maintain_order_at, account_signers, customer_signers):
        signers = []
        if maintain_order_at == 'none':
            for item in account_signers:
                item['order'] = None
                item['type'] = 'account'
                signers.append(item)
            for item in customer_signers:
                item['order'] = None
                item['type'] = 'customer'
                signers.append(item)
        elif maintain_order_at == 'both':
            order = 0
            for item in account_signers:
                item['order'] = order
                item['type'] = 'account'
                signers.append(item)
                order += 1
            for item in customer_signers:
                item['order'] = order
                item['type'] = 'customer'
                signers.append(item)
                order += 1
        elif maintain_order_at == 'account':
            order = -1
            for item in account_signers:
                item['order'] = None if order == -1 else order
                item['type'] = 'account'
                signers.append(item)
                order += 1
            for item in customer_signers:
                item['order'] = None
                item['type'] = 'customer'
                signers.append(item)
        elif maintain_order_at == 'customer':
            for item in account_signers:
                item['order'] = None
                item['type'] = 'account'
                signers.append(item)
            order = -1
            for item in customer_signers:
                item['order'] = None if order == -1 else order
                item['type'] = 'customer'
                signers.append(item)
                order += 1
        return signers


class ContractEventView(APIView):
    serializer_class = SendContractSignerSerializer

    @transaction.atomic
    def post(self, request):
        payload = json.loads(request.data.get('json'))
        logger.info('event payload - %s', payload)

        signature_request_payload = payload.get('signature_request')
        event_detail = payload.get('event')
        contract_signature_obj = ContractSignature.objects.filter(
            signature_request_id=signature_request_payload.get('signature_request_id'),
            is_deleted=False).order_by(F("created_on").desc()).first()
        if not contract_signature_obj:
            logger.error('contract signature object not found for id - %s',
                         signature_request_payload.get('signature_request_id'))
            raise ContractSignatureNotFoundException('Contract signature details not found')

        contract_sign_status = self.get_contract_sign_status(event_detail.get('event_type'))

        if contract_sign_status == ESignStatus.Expired.value and contract_signature_obj.contract_id.status not in (
            ESignStatus.Draft, ESignStatus.InApprovalProcess
        ):
            return ResponseBuilder.success(
                data="Hello API Event Received", status_code=status.HTTP_200_OK
            )
        if contract_sign_status:
            contract_signature_obj.contract_id.status = contract_sign_status
            contract_signature_obj.status = contract_sign_status
            contract_signature_obj.contract_id.save()
            contract_signature_obj.save()

        event_detail_obj = EventDetail.objects.create(
            event_type=event_detail.get('event_type'),
            event_time=datetime.datetime.fromtimestamp(int(event_detail.get('event_time')))
            if event_detail.get('event_time') else None,
            event_hash=event_detail.get('event_hash'),
            event_metadata=event_detail.get('event_metadata'),
            contract_signature_id=contract_signature_obj
        )
        if event_detail.get('event_type') not in (
                'signature_request_downloadable',
                'signature_request_all_signed', 'signature_request_canceled'):
            for signature in signature_request_payload.get('signatures', []):
                contract_signer_detail_obj = ContractSignerDetails.objects.filter(
                    signature_id=signature.get('signature_id'), is_deleted=False).first()

                _ = ContractSignerAudit.objects.create(
                    last_viewed_at=datetime.datetime.fromtimestamp(
                        int(signature.get('last_viewed_at'))) if signature.get(
                        'last_viewed_at') else None,
                    last_reminded_at=datetime.datetime.fromtimestamp(
                        int(signature.get('last_reminded_at'))) if signature.get(
                        'last_reminded_at') else None,
                    signed_at=datetime.datetime.fromtimestamp(
                        int(signature.get('signed_at'))) if signature.get('signed_at') else None,
                    status_code=signature.get('status_code'),
                    error=signature.get('error'),
                    contract_signer_details_id=contract_signer_detail_obj,
                    event_detail_id=event_detail_obj
                )

        if event_detail.get('event_type') == 'signature_request_all_signed':
            response = HelloSign().download_file(contract_signature_obj.signature_request_id)
            if not isinstance(response, _io.BufferedReader):
                return ResponseBuilder.success(
                    data="Hello API Event Received", status_code=status.HTTP_200_OK
                )

            temp_dir = "/tmp"
            os.makedirs(temp_dir, exist_ok=True)

            s3_file_path \
                = '/'.join(contract_signature_obj.contract_id.s3_file_path.split('.')[:-1]) + '/signed_document.pdf'
            local_path = os.path.join(temp_dir, os.path.basename(s3_file_path))
            open(local_path, 'wb').write(response.read())
            S3Service.upload_file_from_path(local_path, s3_file_path)
            contract_signature_obj.contract_id.signed_file_path = s3_file_path
            contract_signature_obj.contract_id.save()

        return ResponseBuilder.success(
            data="Hello API Event Received", status_code=status.HTTP_200_OK
        )

    @staticmethod
    def get_contract_sign_status(sign_status):
        return {
            'signature_request_canceled': ESignStatus.Cancelled.value,
            'signature_request_all_signed': ESignStatus.Activated.value,
            'signature_request_declined': ESignStatus.Declined.value,
            'signature_request_signed': ESignStatus.InApprovalProcess.value,
            'signature_request_expired': ESignStatus.Expired.value
        }.get(sign_status)


class ContractRemoveView(APIView):
    serializer_class = SendContractSignerSerializer
    authentication_classes = [CognitoAuthentication]

    @transaction.atomic
    def post(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])
        contract_obj = Contract.objects.filter(
            id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not contract_obj:
            logger.error('contract not found for given id - %s', id)
            raise ContractNotFoundException('Contract not found')

        contract_signature_obj = ContractSignature.objects.filter(
            contract_id=id, is_deleted=False).first()
        if not contract_signature_obj:
            logger.error('contract signature object not found for id - %s', id)
            raise ContractSignatureNotFoundException('Contract signature details not found')

        if contract_obj.status in {ESignStatus.Expired.value, ESignStatus.Cancelled.value}:
            raise ContractSignatureNotFoundException(
                'Unable to cancel the contract as it is already expired/cancelled')

        HelloSign().remove_signature_request_access(contract_signature_obj.signature_request_id)
        contract_signature_obj.status = ESignStatus.Cancelled.value
        contract_obj.status = ESignStatus.Cancelled.value
        contract_obj.s3_file_path = None
        contract_signature_obj.save()
        contract_obj.save()
        return ResponseBuilder.success(
            data="Cancel request submitted successfully", status_code=status.HTTP_200_OK
        )


class ContractDownloadView(APIView):
    serializer_class = SendContractSignerSerializer
    authentication_classes = [CognitoAuthentication]

    @transaction.atomic
    def get(self, request, id):
        tenant_id = get_tenant_id_from_email(request.user[0])

        contract_obj = Contract.objects.filter(id=id, is_deleted=False, tenant_id=tenant_id).first()
        if not contract_obj:
            logger.error('contract not found for given id - %s', id)
            raise ContractNotFoundException('Contract not found')
        if not contract_obj.status == ESignStatus.Activated.value:
            logger.error('contract status is not activated for given id - %s', id)
            raise ContractNotFoundException('Contract status is not active')

        signed_file_path = contract_obj.signed_file_path
        if not signed_file_path:
            return ResponseBuilder.success(data=dict(pre_signed_url=None), status_code=status.HTTP_200_OK)
        pre_signed_url = S3Service.generate_presigned_url(signed_file_path)
        return ResponseBuilder.success(data=dict(pre_signed_url=pre_signed_url), status_code=status.HTTP_200_OK)
