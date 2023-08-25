import datetime
from decimal import Decimal

from django.utils.timezone import get_default_timezone

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from merchants.models import OrderStatus, PaymentOrder
from reservations.models import STATE_CHOICES, Reservation
from reservations.tasks import refund_paid_reservation_task

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationRefundSerializer(PrimaryKeySerializer):
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

        if self.instance.state not in [STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED] and self.instance.end >= now:
            raise ValidationErrorWithCode(
                f"Only reservations in the past or in state {STATE_CHOICES.CANCELLED.upper()} "
                + f"or {STATE_CHOICES.DENIED.upper()} can be refunded.",
                ValidationErrorCodes.REFUND_NOT_ALLOWED,
            )

        payment_order = PaymentOrder.objects.filter(
            reservation=self.instance, status=OrderStatus.PAID, refund_id__isnull=True
        ).first()
        if not payment_order:
            raise ValidationErrorWithCode(
                "Only reservations with paid order can be refunded.",
                ValidationErrorCodes.REFUND_NOT_ALLOWED,
            )

        data = super().validate(data)
        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        refund_paid_reservation_task.delay(instance.pk)
        return instance
