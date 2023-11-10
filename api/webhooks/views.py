import uuid
from datetime import datetime
from typing import Any

from django.utils.timezone import get_default_timezone
from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from sentry_sdk import capture_message

from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import GetOrderError
from merchants.verkkokauppa.order.requests import get_order
from merchants.verkkokauppa.payment.exceptions import GetPaymentError, GetRefundStatusError
from merchants.verkkokauppa.payment.requests import get_payment, get_refund_status
from merchants.verkkokauppa.payment.types import PaymentStatus, RefundStatus
from reservations.choices import ReservationStateChoice
from reservations.email_utils import send_confirmation_email
from reservations.models import Reservation

from .permissions import WebhookPermission
from .serializers import (
    WebhookOrderCancelSerializer,
    WebhookPaymentSerializer,
    WebhookRefundSerializer,
    sentry_webhook_error,
)


class WebhookOrderPaidViewSet(viewsets.GenericViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            sentry_webhook_error(serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]
        payment_id: str = serializer.validated_data["paymentId"]
        namespace: str = serializer.validated_data["namespace"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=order_id).first()
        if payment_order is None:
            msg = f"Payment order {order_id=!s} not found"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if payment_order.status not in [OrderStatus.DRAFT, OrderStatus.EXPIRED, OrderStatus.CANCELLED]:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            payment = get_payment(order_id, namespace)
        except GetPaymentError:
            msg = f"Checking payment for order '{order_id}' failed"
            capture_message(msg)
            return Response(data={"message": msg}, status=500)

        if payment is None:
            msg = f"Payment '{order_id}' not found from verkkokauppa"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if payment.status != PaymentStatus.PAID_ONLINE.value:
            msg = f"Invalid payment status: '{payment.status}'"
            capture_message(msg)
            return Response(data={"message": msg}, status=400)

        payment_order.status = OrderStatus.PAID
        payment_order.payment_id = payment_id
        payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
        payment_order.save()

        reservation: Reservation | None = payment_order.reservation
        if reservation is not None and reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT:
            reservation.state = ReservationStateChoice.CONFIRMED
            reservation.save()
            send_confirmation_email(reservation)

        return Response(data={"message": "Order payment completed successfully"}, status=200)


class WebhookOrderCancelViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookOrderCancelSerializer(data=request.data)
        if not serializer.is_valid():
            sentry_webhook_error(serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=order_id).first()
        if payment_order is None:
            msg = f"Payment order {order_id=!s} not found"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if payment_order.status not in [OrderStatus.DRAFT]:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            order = get_order(order_id)
        except GetOrderError:
            msg = f"Checking order '{order_id}' failed"
            capture_message(msg)
            return Response(data={"message": msg}, status=500)

        if order is None:
            msg = f"Order '{order_id}' not found from verkkokauppa"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if order.status != "cancelled":
            msg = f"Invalid order status: '{order.status}'"
            capture_message(msg)
            return Response(data={"message": msg}, status=400)

        payment_order.status = OrderStatus.CANCELLED
        payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
        payment_order.save()

        return Response(data={"message": "Order cancellation completed successfully"}, status=200)


class WebhookRefundViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookRefundSerializer(data=request.data)
        if not serializer.is_valid():
            sentry_webhook_error(serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]
        refund_id: uuid.UUID = serializer.validated_data["refundId"]
        namespace: str = serializer.validated_data["namespace"]

        payment_order: PaymentOrder | None
        payment_order = PaymentOrder.objects.filter(remote_id=order_id, refund_id=refund_id).first()
        if payment_order is None:
            msg = f"Payment order {order_id=!s} & {refund_id=!s} not found"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if payment_order.status not in [OrderStatus.PAID]:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            refund_result = get_refund_status(order_id, namespace)
        except GetRefundStatusError:
            msg = f"Checking order '{order_id}' failed"
            capture_message(msg)
            return Response(data={"message": msg}, status=500)

        if refund_result is None:
            msg = f"Refund for order '{order_id}' not found from verkkokauppa"
            capture_message(msg)
            return Response(data={"message": msg}, status=404)

        if refund_result.status != RefundStatus.PAID_ONLINE.value:
            msg = f"Invalid refund status: '{refund_result.status}'"
            capture_message(msg)
            return Response(data={"message": msg}, status=400)

        payment_order.status = OrderStatus.REFUNDED
        payment_order.processed_at = datetime.now().astimezone(get_default_timezone())
        payment_order.save()

        return Response(data={"message": "Order refund completed successfully"}, status=200)
