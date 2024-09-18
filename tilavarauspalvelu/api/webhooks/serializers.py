from django.conf import settings
from rest_framework import serializers


class WebhookPaymentSerializer(serializers.Serializer):
    paymentId = serializers.CharField()  # format: uuid + _at_ + yyyymmdd-hhmmss
    orderId = serializers.UUIDField()
    namespace = serializers.CharField()
    eventType = serializers.CharField()

    @staticmethod
    def validate_namespace(namespace: str) -> str:
        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise serializers.ValidationError(f"Invalid namespace: '{namespace}'")
        return namespace

    @staticmethod
    def validate_eventType(event_type: str) -> str:
        if event_type != "PAYMENT_PAID":
            raise serializers.ValidationError(f"Unsupported event type: '{event_type}'")
        return event_type


class WebhookOrderCancelSerializer(serializers.Serializer):
    orderId = serializers.UUIDField()
    namespace = serializers.CharField()
    eventType = serializers.CharField()

    @staticmethod
    def validate_namespace(namespace: str) -> str:
        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise serializers.ValidationError(f"Invalid namespace: '{namespace}'")
        return namespace

    @staticmethod
    def validate_eventType(event_type: str) -> str:
        if event_type != "ORDER_CANCELLED":
            raise serializers.ValidationError(f"Unsupported event type: '{event_type}'")
        return event_type


class WebhookRefundSerializer(serializers.Serializer):
    orderId = serializers.UUIDField()
    refundId = serializers.UUIDField()
    refundPaymentId = serializers.CharField()  # format: uuid + _at_ + yyyymmdd-hhmmss
    namespace = serializers.CharField()
    eventType = serializers.CharField()

    @staticmethod
    def validate_namespace(namespace: str) -> str:
        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise serializers.ValidationError(f"Invalid namespace: '{namespace}'")
        return namespace

    @staticmethod
    def validate_eventType(event_type: str) -> str:
        if event_type != "REFUND_PAID":
            raise serializers.ValidationError(f"Unsupported event type: '{event_type}'")
        return event_type
