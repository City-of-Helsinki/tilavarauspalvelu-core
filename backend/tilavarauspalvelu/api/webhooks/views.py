from __future__ import annotations

from typing import TYPE_CHECKING, Any

from rest_framework import viewsets
from rest_framework.response import Response

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import GetOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError, GetRefundStatusError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopRefundStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentOrder
from utils.date_utils import local_datetime

from .permissions import WebhookPermission
from .serializers import WebhookOrderCancelSerializer, WebhookPaymentSerializer, WebhookRefundSerializer

if TYPE_CHECKING:
    import uuid

    from rest_framework.request import Request


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
            msg = "Payment order not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.status not in OrderStatus.can_be_marked_paid_statuses:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            webshop_payment = VerkkokauppaAPIClient.get_payment(order_uuid=order_id)
        except GetPaymentError:
            msg = "Could not get payment from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if webshop_payment is None:
            msg = "Payment not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        order_status = payment_order.actions.get_order_status_from_webshop_payment(webshop_payment)
        if order_status not in OrderStatus.paid_in_webshop:
            msg = "Payment order doesn't require update based webshop payment status"
            details = {
                **serializer.validated_data,
                "webshop_payment_status": webshop_payment.status,
                "payment_order_status": order_status.value,
            }
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=details)
            return Response(data={"message": msg}, status=400)

        payment_order.status = order_status
        payment_order.processed_at = local_datetime()
        payment_order.payment_id = payment_id
        payment_order.save(update_fields=["status", "processed_at", "payment_id"])

        payment_order.actions.complete_payment()

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
            msg = "Payment order not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.status == OrderStatus.PENDING:
            msg = "Pending order remains payable until its due date"
            return Response(data={"message": msg}, status=200)

        if payment_order.status not in OrderStatus.can_be_cancelled_statuses:
            msg = "Order is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            webshop_order = VerkkokauppaAPIClient.get_order(order_uuid=order_id)
        except GetOrderError:
            msg = "Could not get order from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if webshop_order is None:
            msg = "Order not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if webshop_order.status != WebShopOrderStatus.CANCELLED:
            msg = "Payment order cannot be cancelled based webshop order status"
            details = {
                **serializer.validated_data,
                "webshop_order_status": webshop_order.status,
                "payment_order_status": payment_order.status,
            }
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=details)
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
            msg = "Payment order not found"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if payment_order.refund_id is not None and payment_order.refund_id != refund_id:
            msg = "Refund ID mismatch"
            details = {
                **serializer.validated_data,
                "payment_order_refund_id": payment_order.refund_id,
            }
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=details)
            return Response(data={"message": msg}, status=400)

        if payment_order.status not in OrderStatus.can_be_refunded_statuses:
            msg = f"Order '{order_id}' is already in a state where no updates are needed"
            return Response(data={"message": msg}, status=200)

        try:
            refund_result = VerkkokauppaAPIClient.get_refund_status(order_uuid=order_id)
        except GetRefundStatusError:
            msg = "Could not get refund status from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=500)

        if refund_result is None:
            msg = "Refund status not found from verkkokauppa"
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=serializer.validated_data)
            return Response(data={"message": msg}, status=404)

        if refund_result.status != WebShopRefundStatus.PAID_ONLINE:
            msg = "Payment order cannot be refunded based webshop refund status"
            details = {
                **serializer.validated_data,
                "webshop_refund_status": refund_result.status,
            }
            SentryLogger.log_message(f"Verkkokauppa: {msg}", details=details)
            return Response(data={"message": msg}, status=400)

        payment_order.status = OrderStatus.REFUNDED
        payment_order.processed_at = local_datetime()
        payment_order.save(update_fields=["status", "processed_at"])

        return Response(data={"message": "Order refund completed successfully"}, status=200)
