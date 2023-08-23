from datetime import datetime

import graphene
from django.conf import settings
from django.utils.timezone import get_default_timezone
from graphene import relay
from graphene_permissions.mixins import AuthMutation
from sentry_sdk import capture_exception, capture_message, push_scope

from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.requests import get_payment
from permissions.api_permissions.graphene_permissions import OrderRefreshPermission
from reservations.email_utils import send_confirmation_email
from reservations.models import STATE_CHOICES

from ..validation_errors import ValidationErrorCodes, ValidationErrorWithCode

TIMEZONE = get_default_timezone()


class RefreshOrderMutation(relay.ClientIDMutation, AuthMutation):
    permission_classes = (OrderRefreshPermission,)

    class Input:
        order_uuid = graphene.UUID(required=True)

    order_uuid = graphene.UUID()
    status = graphene.String()
    reservation_pk = graphene.Int()

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            raise ValidationErrorWithCode("No permission to refresh the order", ValidationErrorCodes.NO_PERMISSION)

        needs_update_statuses = [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]

        remote_id = input.get("order_uuid")
        payment_order = PaymentOrder.objects.filter(remote_id=remote_id).first()
        if not payment_order:
            raise ValidationErrorWithCode("Order not found", ValidationErrorCodes.NOT_FOUND)

        if payment_order.status not in needs_update_statuses:
            return RefreshOrderMutation(
                order_uuid=payment_order.remote_id,
                status=payment_order.status,
                reservation_pk=payment_order.reservation.pk,
            )

        try:
            payment = get_payment(remote_id, settings.VERKKOKAUPPA_NAMESPACE)
            if not payment:
                capture_message(
                    f"Order payment check failed: payment not found ({remote_id})",
                    level="warning",
                )
                raise ValidationErrorWithCode("Unable to check order payment", ValidationErrorCodes.NOT_FOUND)
        except GetPaymentError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Order payment check failed")
                scope.set_extra("remote-id", remote_id)
                capture_exception(err)
            raise ValidationErrorWithCode(
                "Unable to check order payment: problem with external service",
                ValidationErrorCodes.EXTERNAL_SERVICE_ERROR,
            ) from err

        payment_order.payment_id = payment.payment_id
        payment_order.processed_at = datetime.now().astimezone(TIMEZONE)

        if payment.status == "payment_cancelled" and payment_order.status is not OrderStatus.CANCELLED:
            payment_order.status = OrderStatus.CANCELLED
            payment_order.save()

        if payment.status == "payment_paid_online" and payment_order.status is not OrderStatus.PAID:
            payment_order.status = OrderStatus.PAID
            payment_order.save()

            if payment_order.reservation.state == STATE_CHOICES.WAITING_FOR_PAYMENT:
                payment_order.reservation.state = STATE_CHOICES.CONFIRMED
                payment_order.reservation.save()
                send_confirmation_email(payment_order.reservation)

        return RefreshOrderMutation(
            order_uuid=payment_order.remote_id,
            status=payment_order.status,
            reservation_pk=payment_order.reservation.pk,
        )
