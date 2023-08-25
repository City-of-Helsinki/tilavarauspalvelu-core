from datetime import datetime
from typing import Dict

from django.conf import settings
from django.utils.timezone import get_default_timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, viewsets
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from sentry_sdk import capture_exception, capture_message, push_scope

from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import GetOrderError
from merchants.verkkokauppa.order.requests import get_order
from merchants.verkkokauppa.payment.exceptions import (
    GetPaymentError,
    GetRefundStatusError,
)
from merchants.verkkokauppa.payment.requests import get_payment, get_refund_status
from merchants.verkkokauppa.payment.types import RefundStatus
from permissions.api_permissions.drf_permissions import WebhookPermission
from reservations.email_utils import send_confirmation_email
from reservations.models import STATE_CHOICES, Reservation

default_responses = (
    {
        200: OpenApiResponse(description="OK"),
        400: OpenApiResponse(description="Invalid payload or namespace"),
        404: OpenApiResponse(description="Order not found"),
        500: OpenApiResponse(description="Internal server error or problem with upstream service"),
        501: OpenApiResponse(description="Unsupported type"),
    },
)


class WebhookError(APIException):
    def __init__(self, message: str, status_code: int):
        self.status_code = status_code
        self.detail = message

    def to_json(self) -> Dict[str, any]:
        return {"status": self.status_code, "message": self.detail}


class WebhookPaymentViewSet(viewsets.GenericViewSet):
    permission_classes = [WebhookPermission]

    def validate_request(self, request):
        required_field = [
            "paymentId",
            "orderId",
            "namespace",
            "eventType",
        ]
        for field in required_field:
            if field not in request.data:
                raise WebhookError(message=f"Required field missing: {field}", status_code=400)

        namespace = request.data.get("namespace", None)
        webhook_type = request.data.get("eventType", None)

        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise WebhookError(message="Invalid namespace", status_code=400)

        if webhook_type != "PAYMENT_PAID":
            raise WebhookError(message="Unsupported type", status_code=501)

    @extend_schema(
        request=inline_serializer(
            name="WebhookPaymentPayload",
            fields={
                "paymentId": serializers.UUIDField(),
                "orderId": serializers.UUIDField(),
                "namespace": serializers.CharField(),
                "eventType": serializers.ChoiceField(
                    choices=[
                        (
                            "PAYMENT_PAID",
                            "PAYMENT_PAID",
                        )
                    ]
                ),
            },
        ),
        responses=default_responses,
    )
    def create(self, request):
        needs_update_statuses = [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]
        try:
            self.validate_request(request)

            remote_id = request.data.get("orderId", "")
            payment_id = request.data.get("paymentId", "")

            payment_order = PaymentOrder.objects.filter(remote_id=remote_id).first()
            if not payment_order:
                raise WebhookError(message="Order not found", status_code=404)

            # Order is already in a state where no updates are needed
            if payment_order.status not in needs_update_statuses:
                return Response(status=200)

            # Check payment status from the API
            payment = get_payment(remote_id, settings.VERKKOKAUPPA_NAMESPACE)
            payment_status = getattr(payment, "status", "payment_not_found")

            if payment_status != "payment_paid_online":
                capture_message(
                    f"Received payment webhook for order {remote_id} that is not paid: {payment_status}",
                    level="warning",
                )
                raise WebhookError(message="Invalid payment state", status_code=400)

            if payment_order.status in needs_update_statuses:
                payment_order.status = OrderStatus.PAID
                payment_order.payment_id = payment_id
                payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
                payment_order.save()

            reservation: Reservation = payment_order.reservation
            if reservation.state == STATE_CHOICES.WAITING_FOR_PAYMENT:
                reservation.state = STATE_CHOICES.CONFIRMED
                reservation.save()
                send_confirmation_email(reservation)

            return Response(status=200)
        except WebhookError as e:
            with push_scope() as scope:
                scope.set_extra("details", "Invalid payment webhook")
                scope.set_extra("data", e.to_json())
                scope.set_extra("status_code", e.status_code)
                capture_exception(e)
            return Response(data=e.to_json(), status=e.status_code)
        except GetPaymentError as e:
            with push_scope() as scope:
                scope.set_extra("details", "Checking order payment failed")
                scope.set_extra("remote_id", remote_id)
                capture_exception(e)
            return Response(
                data={"status": 500, "message": "Problem with upstream service"},
                status=500,
            )


class WebhookOrderViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def validate_request(self, request):
        required_field = ["orderId", "namespace", "eventType"]
        for field in required_field:
            if field not in request.data:
                raise WebhookError(message=f"Required field missing: {field}", status_code=400)

        namespace = request.data.get("namespace", None)
        webhook_type = request.data.get("eventType", None)

        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise WebhookError(message="Invalid namespace", status_code=400)

        if webhook_type != "ORDER_CANCELLED":
            raise WebhookError(message="Unsupported type", status_code=501)

    @extend_schema(
        request=inline_serializer(
            name="WebhookOrderPayload",
            fields={
                "orderId": serializers.UUIDField(),
                "namespace": serializers.CharField(),
                "eventType": serializers.ChoiceField(choices=[("ORDER_CANCELLED", "ORDER_CANCELLED")]),
            },
        ),
        responses=default_responses,
    )
    def create(self, request):
        try:
            self.validate_request(request)

            remote_id = request.data.get("orderId", "")
            payment_order = PaymentOrder.objects.filter(remote_id=remote_id).first()
            if not payment_order:
                raise WebhookError(message="Order not found", status_code=404)

            # Order is already in a state where no updates are needed
            if payment_order.status != OrderStatus.DRAFT:
                return Response(status=200)

            # Check order status from the API
            order = get_order(remote_id, payment_order.reservation.user.id)
            order_status = getattr(order, "status", "payment_not_found")

            if order_status != "cancelled":
                capture_message(
                    f"Received order cancellation webhook for order {remote_id} "
                    f"that is not in cancelled state: {order_status}",
                    level="warning",
                )
                raise WebhookError(message="Invalid order state", status_code=400)

            payment_order.status = OrderStatus.CANCELLED
            payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
            payment_order.save()

            return Response(status=200)
        except WebhookError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Invalid order webhook")
                scope.set_extra("data", err.to_json())
                scope.set_extra("status_code", err.status_code)
                capture_exception(err)
            return Response(data=err.to_json(), status=err.status_code)
        except GetOrderError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Order checking failed")
                scope.set_extra("remote_id", remote_id)
                capture_exception(err)
            return Response(
                data={"status": 500, "message": "Problem with upstream service"},
                status=500,
            )


class WebhookRefundViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def validate_request(self, request):
        required_field = [
            "orderId",
            "refundId",
            "refundPaymentId",
            "namespace",
            "eventType",
        ]
        for field in required_field:
            if field not in request.data:
                raise WebhookError(message=f"Required field missing: {field}", status_code=400)

        namespace = request.data.get("namespace", None)
        webhook_type = request.data.get("eventType", None)

        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise WebhookError(message="Invalid namespace", status_code=400)

        if webhook_type != "REFUND_PAID":
            raise WebhookError(message="Unsupported type", status_code=501)

    @extend_schema(
        request=inline_serializer(
            name="WebhookRefundPayload",
            fields={
                "orderId": serializers.UUIDField(),
                "refundId": serializers.UUIDField(),
                "refundPaymentId": serializers.UUIDField(),
                "namespace": serializers.CharField(),
                "eventType": serializers.ChoiceField(choices=[("REFUND_PAID", "REFUND_PAID")]),
            },
        ),
        responses=default_responses,
    )
    def create(self, request):
        try:
            self.validate_request(request)

            remote_id = request.data.get("orderId", "")
            refund_id = request.data.get("refundId", "")
            payment_order = PaymentOrder.objects.filter(remote_id=remote_id, refund_id=refund_id).first()

            if not payment_order:
                raise WebhookError(message="Order not found", status_code=404)

            # Order is already in a state where no updates are needed
            if payment_order.status != OrderStatus.PAID:
                return Response(status=200)

            refund_status = get_refund_status(remote_id, settings.VERKKOKAUPPA_NAMESPACE)
            if not refund_status:
                raise WebhookError(message="Refund not found", status_code=400)
            if refund_status.status != RefundStatus.PAID_ONLINE.value:
                raise WebhookError(message="Invalid refund state", status_code=400)

            payment_order.status = OrderStatus.REFUNDED
            payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
            payment_order.save()

            return Response(status=200)
        except WebhookError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Invalid refund webhook")
                scope.set_extra("data", err.to_json())
                scope.set_extra("status_code", err.status_code)
                capture_exception(err)
            return Response(data=err.to_json(), status=err.status_code)
        except GetRefundStatusError as err:
            with push_scope() as scope:
                scope.set_extra("details", f"Fetching refund status failed: {str(err)}")
                scope.set_extra("data", request.data)
                capture_exception(err)
            return Response(
                data={"status": 500, "message": "Problem with upstream service"},
                status=500,
            )
