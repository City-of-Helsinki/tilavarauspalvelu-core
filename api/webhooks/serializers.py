from typing import Any

from django.conf import settings
from rest_framework import serializers
from sentry_sdk import capture_message, push_scope


def sentry_webhook_error(errors: dict[str, Any]) -> None:
    with push_scope() as scope:
        scope.set_extra("message", errors)
        capture_message("Invalid webhook")


class WebhookPaymentSerializer(serializers.Serializer):
    paymentId = serializers.UUIDField()
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
    refundPaymentId = serializers.UUIDField()
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
