from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.reservation_email_notification_sender import (
    ReservationEmailNotificationSender,
)
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import refund_paid_reservation_task
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder

__all__ = [
    "ReservationCancellationSerializer",
]


class ReservationCancellationSerializer(NestingModelSerializer):
    instance: Reservation

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "cancel_reason",
            "cancel_details",
            "state",
        ]
        extra_kwargs = {
            "cancel_reason": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        data = super().validate(data)
        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            msg = "Only reservations with state 'CONFIRMED' can be cancelled."
            raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

        now = local_datetime()
        if self.instance.begin < now:
            msg = "Reservation cannot be cancelled after it has begun."
            raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

        for reservation_unit in self.instance.reservation_unit.all():
            cancel_rule = reservation_unit.cancellation_rule
            if cancel_rule is None:
                msg = "Reservation cannot be cancelled because its reservation unit has no cancellation rule."
                raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

            must_be_cancelled_before = self.instance.begin - cancel_rule.can_be_cancelled_time_before
            if must_be_cancelled_before < now:
                msg = "Reservation cannot be cancelled because the cancellation period is over."
                raise ValidationError(msg, code=error_codes.RESERVATION_CANCELLATION_NOT_ALLOWED)

            if cancel_rule.needs_handling:
                msg = "Reservation cancellation needs manual handling."
                raise ValidationError(msg, code=error_codes.RESERVATION_REQUIRES_MANUAL_HANDLING)

        return data

    def save(self, **kwargs: Any) -> Reservation:
        kwargs["state"] = ReservationStateChoice.CANCELLED.value
        instance: Reservation = super().save(**kwargs)

        payment_order: PaymentOrder | None = instance.payment_order.first()
        payment_is_refundable = (
            payment_order is not None  # There is a payment order
            and payment_order.status == OrderStatus.PAID  # This is a paid reservation
            and payment_order.refund_id is None  # Not refunded already
        )

        if payment_is_refundable and instance.price_net > 0:
            refund_paid_reservation_task.delay(instance.pk)

        ReservationEmailNotificationSender.send_cancellation_email(reservation=instance)
        return instance
