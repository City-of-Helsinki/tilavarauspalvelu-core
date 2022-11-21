from datetime import datetime
from typing import Dict

from django.conf import settings
from django.utils.timezone import get_default_timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, viewsets
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from sentry_sdk import capture_message

from merchants.models import PaymentOrder, PaymentStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.requests import get_payment
from permissions.api_permissions.drf_permissions import WebhookPermission
from reservations.email_utils import send_confirmation_email
from reservations.models import STATE_CHOICES, Reservation


class WebhookError(APIException):
    def __init__(self, message: str, status_code: int):
        self.status_code = status_code
        self.detail = message

    def to_json(self) -> Dict[str, any]:
        return {"status": self.status_code, "message": self.detail}


class WebhookPaymentViewSet(viewsets.GenericViewSet):
    permission_classes = [WebhookPermission]

    def validate_request(self, request):
        required_field = ["paymentId", "orderId", "namespace", "type", "timestamp"]
        for field in required_field:
            if field not in request.data:
                raise WebhookError(
                    message=f"Required field missing: {field}", status_code=400
                )

        namespace = request.data.get("namespace", None)
        type = request.data.get("type", None)

        if namespace != settings.VERKKOKAUPPA_NAMESPACE:
            raise WebhookError(message="Invalid namespace", status_code=400)

        if type != "PAYMENT_PAID":
            raise WebhookError(message="Unsupported type", status_code=501)

    @extend_schema(
        request=inline_serializer(
            name="WebhookPaymentPayload",
            fields={
                "paymentId": serializers.UUIDField(),
                "orderId": serializers.UUIDField(),
                "namespace": serializers.CharField(),
                "type": serializers.ChoiceField(
                    choices=[("PAYMENT_PAID", "PAYMENT_PAID")]
                ),
                "timestamp": serializers.DateTimeField(),
            },
        ),
        responses={
            200: OpenApiResponse(description="OK"),
            400: OpenApiResponse(description="Invalid payload, namespace or type"),
            404: OpenApiResponse(description="Order not found"),
            500: OpenApiResponse(
                description="Internal server error or problem with upstream service"
            ),
            501: OpenApiResponse(description="Unsupported type"),
        },
    )
    def create(self, request):
        needs_update_statuses = [
            PaymentStatus.DRAFT,
            PaymentStatus.EXPIRED,
            PaymentStatus.CANCELLED,
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
                payment_order.status = PaymentStatus.PAID
                payment_order.payment_id = payment_id
                payment_order.processed_at = datetime.now().astimezone(
                    get_default_timezone()
                )
                payment_order.save()

            reservation: Reservation = payment_order.reservation
            if reservation.state == STATE_CHOICES.WAITING_FOR_PAYMENT:
                reservation.state = STATE_CHOICES.CONFIRMED
                reservation.save()
                send_confirmation_email(reservation)

            return Response(status=200)
        except WebhookError as e:
            return Response(data=e.to_json(), status=e.status_code)
        except GetPaymentError as e:
            capture_message(f"Checking order payment failed: {str(e)}", level="error")
            return Response(
                data={"status": 500, "message": "Problem with upstream service"},
                status=500,
            )
