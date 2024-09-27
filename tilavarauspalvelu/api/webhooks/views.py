from typing import TYPE_CHECKING, Any

from rest_framework import viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import PaymentOrder
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import GetOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError, GetRefundStatusError
from tilavarauspalvelu.utils.verkkokauppa.payment.types import PaymentStatus, RefundStatus
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime
from utils.sentry import SentryLogger

from .permissions import WebhookPermission
from .serializers import WebhookOrderCancelSerializer, WebhookPaymentSerializer, WebhookRefundSerializer

if TYPE_CHECKING:
    import uuid


class WebhookOrderPaidViewSet(viewsets.GenericViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            SentryLogger.log_message("Verkkokauppa: Invalid webhook", details=serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]
        payment_id: str = serializer.validated_data["paymentId"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=order_id).first()
        if payment_order is None:
            msg = f"Payment order '{order_id}' not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.status not in [OrderStatus.DRAFT, OrderStatus.EXPIRED, OrderStatus.CANCELLED]:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            payment = VerkkokauppaAPIClient.get_payment(order_uuid=order_id)
        except GetPaymentError:
            msg = f"Checking payment for order '{order_id}' failed"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if payment is None:
            msg = f"Payment '{order_id}' not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment.status != PaymentStatus.PAID_ONLINE.value:
            msg = f"Invalid payment status: '{payment.status}'"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=400)

        payment_order.update_order_status(new_status=OrderStatus.PAID, payment_id=payment_id)

        return Response(data={"message": "Order payment completed successfully"}, status=200)


class WebhookOrderCancelViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookOrderCancelSerializer(data=request.data)
        if not serializer.is_valid():
            SentryLogger.log_message("Verkkokauppa: Invalid webhook", details=serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=order_id).first()
        if payment_order is None:
            msg = f"Payment order '{order_id}' not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.status != OrderStatus.DRAFT:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            order = VerkkokauppaAPIClient.get_order(order_uuid=order_id)
        except GetOrderError:
            msg = f"Checking order '{order_id}' failed"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if order is None:
            msg = f"Order '{order_id}' not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if order.status != "cancelled":
            msg = f"Invalid order status: '{order.status}'"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=400)

        payment_order.status = OrderStatus.CANCELLED
        payment_order.processed_at = local_datetime()
        payment_order.save(update_fields=["status", "processed_at"])

        return Response(data={"message": "Order cancellation completed successfully"}, status=200)


class WebhookRefundViewSet(viewsets.ViewSet):
    permission_classes = [WebhookPermission]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = WebhookRefundSerializer(data=request.data)
        if not serializer.is_valid():
            SentryLogger.log_message("Verkkokauppa: Invalid webhook", details=serializer.errors)
            return Response(data=serializer.errors, status=400)

        order_id: uuid.UUID = serializer.validated_data["orderId"]
        refund_id: uuid.UUID = serializer.validated_data["refundId"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=order_id).first()
        if payment_order is None:
            msg = f"Payment order {order_id=!s} not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.refund_id is not None and payment_order.refund_id != refund_id:
            msg = f"Refund ID mismatch: expected {payment_order.refund_id}, got {refund_id}"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=400)

        if payment_order.status != OrderStatus.PAID:
            msg = f"Order '{order_id}' is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            refund_result = VerkkokauppaAPIClient.get_refund_status(order_uuid=order_id)
        except GetRefundStatusError:
            msg = f"Checking order '{order_id}' failed"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if refund_result is None:
            msg = f"Refund for order '{order_id}' not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if refund_result.status != RefundStatus.PAID_ONLINE.value:
            msg = f"Invalid refund status: '{refund_result.status}'"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=400)

        payment_order.refund_id = refund_id
        payment_order.status = OrderStatus.REFUNDED
        payment_order.processed_at = local_datetime()
        payment_order.save(update_fields=["refund_id", "status", "processed_at"])

        return Response(data={"message": "Order refund completed successfully"}, status=200)
