import datetime
from decimal import Decimal

from django.utils.timezone import get_default_timezone

from api.graphql.extensions.serializers import OldPrimaryKeySerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from merchants.models import OrderStatus, PaymentOrder
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from reservations.tasks import refund_paid_reservation_task

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationRefundSerializer(OldPrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = [
            "pk",
        ]

    def validate(self, data):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        if self.instance.price_net <= Decimal("0.0"):
            raise ValidationErrorWithCode(
                "Only reservations with price greater than 0 can be refunded.",
                ValidationErrorCodes.REFUND_NOT_ALLOWED,
            )

        valid_states: list[ReservationStateChoice]
        valid_states = sorted([ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])

        if self.instance.state not in valid_states and self.instance.end >= now:
            raise ValidationErrorWithCode(
                f"Only reservations in the past or in state "
                f"{' or '.join(choice.value.upper() for choice in valid_states)} can be refunded.",
                ValidationErrorCodes.REFUND_NOT_ALLOWED,
            )

        payment_order = PaymentOrder.objects.filter(
            reservation=self.instance,
            status=OrderStatus.PAID,
            refund_id__isnull=True,
        ).first()
        if not payment_order:
            raise ValidationErrorWithCode(
                "Only reservations with paid order can be refunded.",
                ValidationErrorCodes.REFUND_NOT_ALLOWED,
            )

        return super().validate(data)

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        refund_paid_reservation_task.delay(instance.pk)
        return instance
