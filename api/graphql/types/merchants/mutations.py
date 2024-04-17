import uuid
from typing import Any, NamedTuple

from graphene_django_extensions.bases import DjangoMutation

from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from api.graphql.types.merchants.permissions import OrderRefreshPermission
from api.graphql.types.merchants.serializers import RefreshOrderInputSerializer, RefreshOrderOutputSerializer
from common.date_utils import local_datetime
from common.typing import GQLInfo
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from utils.sentry import SentryLogger


class RefreshOrderMutationOutput(NamedTuple):
    order_uuid: uuid.UUID
    status: str
    reservation_pk: int


class RefreshOrderMutation(DjangoMutation):
    class Meta:
        serializer_class = RefreshOrderInputSerializer
        output_serializer_class = RefreshOrderOutputSerializer
        permission_classes = [OrderRefreshPermission]

    @classmethod
    def custom_mutation(cls, info: GQLInfo, input_data: dict[str, Any]) -> RefreshOrderMutationOutput:
        remote_id: uuid.UUID = input_data["order_uuid"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=remote_id).first()
        if not payment_order:
            raise ValidationErrorWithCode("Order not found", ValidationErrorCodes.NOT_FOUND)

        if payment_order.status not in OrderStatus.needs_update_statuses():
            return RefreshOrderMutationOutput(
                order_uuid=payment_order.remote_id,
                status=payment_order.status,
                reservation_pk=payment_order.reservation.pk,
            )

        try:
            payment = VerkkokauppaAPIClient.get_payment(order_uuid=remote_id)
            if not payment:
                SentryLogger.log_message(
                    message="Verkkokauppa: Order payment check failed",
                    details=f"Order payment check failed: payment not found ({remote_id}).",
                    level="warning",
                )
                msg = "Unable to check order payment"
                raise ValidationErrorWithCode(msg, ValidationErrorCodes.NOT_FOUND)

        except GetPaymentError as error:
            SentryLogger.log_exception(error, details="Order payment check failed", remote_id=remote_id)
            msg = "Unable to check order payment: problem with external service"
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.EXTERNAL_SERVICE_ERROR) from error

        payment_order.payment_id = payment.payment_id
        payment_order.processed_at = local_datetime()

        if payment.status == "payment_cancelled" and payment_order.status is not OrderStatus.CANCELLED:
            payment_order.status = OrderStatus.CANCELLED
            payment_order.save()

        if payment.status == "payment_paid_online" and payment_order.status is not OrderStatus.PAID:
            payment_order.status = OrderStatus.PAID
            payment_order.save()

            if payment_order.reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT:
                payment_order.reservation.state = ReservationStateChoice.CONFIRMED
                payment_order.reservation.save()
                ReservationEmailNotificationSender.send_confirmation_email(reservation=payment_order.reservation)

        return RefreshOrderMutationOutput(
            order_uuid=payment_order.remote_id,
            status=payment_order.status,
            reservation_pk=payment_order.reservation.pk,
        )
