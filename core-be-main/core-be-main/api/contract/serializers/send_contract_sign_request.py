from rest_framework import serializers


class SignerDetailsSerializer(serializers.Serializer):
    email_address = serializers.CharField()
    name = serializers.CharField()


class SendContractSignerSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, default='Contract with Monetizely')
    subject = serializers.CharField(required=False, default='The Contract we talked about')
    message = serializers.CharField(
        required=False, default='Please sign this Contract and then we can discuss more. '
                                'Let me know if you have any questions.')
    maintain_order_at = serializers.CharField(required=True)
    expires_at = serializers.DateTimeField(required=True)
    account_signers = SignerDetailsSerializer(many=True)
    customer_signers = SignerDetailsSerializer(many=True)
